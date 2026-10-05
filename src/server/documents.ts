import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";
import { extractPages } from "@/server/ingestion/extractText";
import { chunkPages } from "@/server/ingestion/chunkText";
import { embedDocuments, saveEmbeddings } from "@/server/retrieval/embeddings";

export const MAX_MB = 8;
export const ALLOWED_EXT = [".pdf", ".docx", ".txt"];

export class UploadError extends Error {}

function extOf(name: string) {
  return "." + (name.split(".").pop() ?? "").toLowerCase();
}

// File ka naam/size check (file padhne se pehle)
export function validateFile(file: File): string | null {
  if (!ALLOWED_EXT.includes(extOf(file.name))) return "Sirf PDF, DOCX ya TXT allowed hai";
  if (file.size === 0) return "File khali hai";
  if (file.size > MAX_MB * 1024 * 1024) return `File ${MAX_MB} MB se badi hai`;
  return null;
}

// Naam .pdf ho sakta hai par andar kuch aur: pehle bytes se pakdo
function matchesType(ext: string, bytes: Buffer) {
  if (ext === ".pdf") return bytes.subarray(0, 5).toString() === "%PDF-";
  if (ext === ".docx") return bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK" (zip)
  return true;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

async function markFailed(documentId: string, message: string) {
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "FAILED", errorMessage: message },
  });
}

export async function saveUploadedDocument(args: {
  workspaceId: string;
  userId: string;
  file: File;
}) {
  const { workspaceId, userId, file } = args;
  const ext = extOf(file.name);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesType(ext, bytes)) {
    throw new UploadError("File ka content uske type se match nahi karta");
  }

  // Path mein workspaceId: har team ki files alag folder mein
  const path = `${workspaceId}/${randomUUID()}-${safeName(file.name)}`;
  await uploadToStorage(path, bytes, file.type);

  let doc;
  try {
    doc = await prisma.document.create({
      data: {
        filename: file.name,
        sizeBytes: bytes.length,
        storagePath: path,
        workspaceId,
        uploadedById: userId,
      },
    });
  } catch (e) {
    await deleteFromStorage(path); // register mein entry nahi hui toh godown se bhi hata do
    throw e;
  }

  // Text -> chunks -> embeddings
  try {
    const pages = await extractPages(bytes, ext);
    const chars = pages.reduce((n, p) => n + p.text.length, 0);
    console.log(`[ingestion] ${file.name}: ${pages.length} pages, ${chars} chars`);

    if (chars === 0) {
      await markFailed(doc.id, "No text was found in this file. It may be a scanned PDF.)");
      return doc;
    }

    // Chunk ki id hum khud banate hain, taaki embedding baad mein sahi row mein likh sakein
    const chunks = chunkPages(pages).map((c) => ({ ...c, id: randomUUID() }));
    await prisma.chunk.createMany({
      data: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        documentId: doc.id,
        workspaceId,
      })),
    });
    console.log(`[ingestion] ${file.name}: ${chunks.length} chunks saved`);

    const vectors = await embedDocuments(chunks.map((c) => c.content));
    await saveEmbeddings(
      chunks.map((c) => c.id),
      vectors,
    );

    await prisma.document.update({ where: { id: doc.id }, data: { status: "READY" } });
    console.log(`[ingestion] ${file.name}: ${vectors.length} embeddings saved, READY`);
  } catch (e) {
    console.error("[ingestion] failed", e);
    await prisma.chunk.deleteMany({ where: { documentId: doc.id } }); // adhoore chunks hata do
    await markFailed(doc.id, "File process karne mein dikkat aayi");
  }

  return doc;
}

export function getWorkspaceDocuments(workspaceId: string) {
  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

// Sirf ADMIN delete kar sakta hai: role ki shart query mein hi hai
export async function deleteDocument(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: { members: { some: { userId, role: "ADMIN" } } },
    },
  });
  if (!doc) return false; // document nahi hai, ya tum ADMIN nahi ho

  await prisma.document.delete({ where: { id: doc.id } });

  try {
    await deleteFromStorage(doc.storagePath);
  } catch (e) {
    console.error("[storage] delete failed", doc.storagePath, e);
  }
  return true;
}