import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";
import { enqueueFileIngestion } from "@/lib/queue";

export const MAX_MB = 8;
export const ALLOWED_EXT = [".pdf", ".docx", ".txt"];

export class UploadError extends Error {}

function extOf(name: string) {
  return "." + (name.split(".").pop() ?? "").toLowerCase();
}

// Check the file name and size (before reading the file)
export function validateFile(file: File): string | null {
  if (!ALLOWED_EXT.includes(extOf(file.name))) return "Only PDF, DOCX or TXT files are allowed";
  if (file.size === 0) return "The file is empty";
  if (file.size > MAX_MB * 1024 * 1024) return `The file is larger than ${MAX_MB} MB`;
  return null;
}

// A name can say .pdf while the content is something else, so check the first bytes
function matchesType(ext: string, bytes: Buffer) {
  if (ext === ".pdf") return bytes.subarray(0, 5).toString() === "%PDF-";
  if (ext === ".docx") return bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK" (zip)
  return true;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

// Saves the file and the document row, then hands the heavy work (text extraction,
// chunking, embeddings) to the background worker. The document starts as PROCESSING.
export async function saveUploadedDocument(args: {
  workspaceId: string;
  userId: string;
  file: File;
}) {
  const { workspaceId, userId, file } = args;
  const ext = extOf(file.name);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesType(ext, bytes)) {
    throw new UploadError("The file content does not match its type");
  }

  // The workspaceId is in the path: every team's files live in a separate folder
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
    await deleteFromStorage(path); // no database row, so remove the stored file too
    throw e;
  }

  // Put a job in the queue; the worker does the rest
  try {
    await enqueueFileIngestion(doc.id);
  } catch (e) {
    console.error("[queue] could not enqueue the document", e);
    doc = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "FAILED",
        errorMessage: "Could not start processing. Please delete this file and try again.",
      },
    });
  }

  return doc;
}

export function getWorkspaceDocuments(workspaceId: string) {
  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

// Only an ADMIN can delete: the role check is part of the query itself
export async function deleteDocument(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspace: { members: { some: { userId, role: "ADMIN" } } },
    },
  });
  if (!doc) return false; // document does not exist, or the user is not an ADMIN

  await prisma.document.delete({ where: { id: doc.id } });

  // Video documents have no stored file
  if (doc.storagePath) {
    try {
      await deleteFromStorage(doc.storagePath);
    } catch (e) {
      console.error("[storage] delete failed", doc.storagePath, e);
    }
  }
  return true;
}

// A document is returned only if the user is a member of its workspace
export function getDocumentForUser(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, workspace: { members: { some: { userId } } } },
  });
}