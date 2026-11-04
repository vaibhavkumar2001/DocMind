import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { downloadFromStorage } from "@/lib/storage";
import { extractPages } from "@/server/ingestion/extractText";
import { chunkPages } from "@/server/ingestion/chunkText";
import { parseTranscript, chunkSegments } from "@/server/ingestion/parseTranscript";
import { embedDocuments, saveEmbeddings } from "@/server/retrieval/embeddings";

// A problem that retrying cannot fix (scanned PDF, corrupt file...). The worker will not retry it.
export class PermanentIngestionError extends Error {}

function extOf(name: string) {
  return "." + (name.split(".").pop() ?? "").toLowerCase();
}

// Marks a document as FAILED and removes half-written chunks.
// It only touches documents that are still PROCESSING, and does nothing if the document was deleted.
export async function markDocumentFailed(documentId: string, message: string) {
  await prisma.chunk.deleteMany({ where: { documentId } });
  await prisma.document.updateMany({
    where: { id: documentId, status: "PROCESSING" },
    data: { status: "FAILED", errorMessage: message },
  });
}

// Embeds the saved chunks, writes the vectors, and marks the document READY
async function embedAndFinish(documentId: string, chunks: { id: string; content: string }[]) {
  const vectors = await embedDocuments(chunks.map((c) => c.content));
  await saveEmbeddings(
    chunks.map((c) => c.id),
    vectors,
  );
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "READY", errorMessage: null },
  });
}

export async function processFileDocument(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    console.log(`[ingestion] ${documentId}: document no longer exists, skipping`);
    return;
  }
  if (doc.status === "READY") return; // already done (safe for retries)
  if (!doc.storagePath) {
    throw new PermanentIngestionError("This document has no stored file.");
  }

  // A retry must start clean, so remove chunks left over from an earlier attempt
  await prisma.chunk.deleteMany({ where: { documentId } });

  const bytes = await downloadFromStorage(doc.storagePath);

  let pages;
  try {
    pages = await extractPages(bytes, extOf(doc.filename));
  } catch (e) {
    console.error(`[ingestion] ${doc.filename}: could not read the file`, e);
    throw new PermanentIngestionError(
      "Could not read this file. It may be corrupted or password protected.",
    );
  }

  const chars = pages.reduce((n, p) => n + p.text.length, 0);
  console.log(`[ingestion] ${doc.filename}: ${pages.length} pages, ${chars} chars`);
  if (chars === 0) {
    throw new PermanentIngestionError(
      "No text was found in this file. It may be a scanned PDF.",
    );
  }

  // We create the chunk ids ourselves, so embeddings can be written to the right rows later
  const chunks = chunkPages(pages).map((c) => ({ ...c, id: randomUUID() }));
  await prisma.chunk.createMany({
    data: chunks.map((c) => ({
      id: c.id,
      content: c.content,
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      documentId,
      workspaceId: doc.workspaceId,
    })),
  });
  console.log(`[ingestion] ${doc.filename}: ${chunks.length} chunks saved`);

  await embedAndFinish(documentId, chunks);
  console.log(`[ingestion] ${doc.filename}: READY`);
}

export async function processTranscriptDocument(documentId: string, transcript: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    console.log(`[ingestion] ${documentId}: document no longer exists, skipping`);
    return;
  }
  if (doc.status === "READY") return;

  await prisma.chunk.deleteMany({ where: { documentId } });

  const chunks = chunkSegments(parseTranscript(transcript)).map((c) => ({
    ...c,
    id: randomUUID(),
  }));
  if (chunks.length === 0) {
    throw new PermanentIngestionError("No readable text found in the transcript.");
  }

  await prisma.chunk.createMany({
    data: chunks.map((c) => ({
      id: c.id,
      content: c.content,
      pageNumber: 1, // pages do not exist for videos; startSeconds is what matters
      startSeconds: c.startSeconds,
      chunkIndex: c.chunkIndex,
      documentId,
      workspaceId: doc.workspaceId,
    })),
  });

  await embedAndFinish(documentId, chunks);
  console.log(`[ingestion] ${doc.filename}: ${chunks.length} chunks, READY`);
}