import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { parseTranscript, chunkSegments } from "@/server/ingestion/parseTranscript";
import { embedDocuments, saveEmbeddings } from "@/server/retrieval/embeddings";

export class TranscriptError extends Error {}

const MAX_CHARS = 200_000;

export async function saveTranscriptDocument(args: {
  workspaceId: string;
  userId: string;
  title: string;
  url: string;
  transcript: string;
}) {
  const title = args.title.trim().slice(0, 120);
  const url = args.url.trim();
  const transcript = args.transcript.trim();

  if (!title) throw new TranscriptError("Please add a title");

  // Only plain web links are accepted (never javascript: or data:)
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TranscriptError("Please enter a valid video link");
  }
  if (!/^https?:$/.test(parsed.protocol) || url.length > 500) {
    throw new TranscriptError("The video link must start with http:// or https://");
  }

  if (transcript.length < 50) throw new TranscriptError("The transcript is too short");
  if (transcript.length > MAX_CHARS) throw new TranscriptError("The transcript is too long");

  const chunks = chunkSegments(parseTranscript(transcript)).map((c) => ({
    ...c,
    id: randomUUID(),
  }));
  if (chunks.length === 0) throw new TranscriptError("No readable text found in the transcript");

  const doc = await prisma.document.create({
    data: {
      filename: title,
      sizeBytes: Buffer.byteLength(transcript),
      storagePath: null, // videos have no stored file
      sourceType: "VIDEO",
      sourceUrl: url,
      workspaceId: args.workspaceId,
      uploadedById: args.userId,
    },
  });

  try {
    await prisma.chunk.createMany({
      data: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        pageNumber: 1, // pages do not exist for videos; startSeconds is what matters
        startSeconds: c.startSeconds,
        chunkIndex: c.chunkIndex,
        documentId: doc.id,
        workspaceId: args.workspaceId,
      })),
    });

    const vectors = await embedDocuments(chunks.map((c) => c.content));
    await saveEmbeddings(
      chunks.map((c) => c.id),
      vectors,
    );

    await prisma.document.update({ where: { id: doc.id }, data: { status: "READY" } });
    console.log(`[transcript] ${title}: ${chunks.length} chunks, READY`);
    return { id: doc.id, filename: doc.filename, status: "READY" as const };
  } catch (e) {
    console.error("[transcript] failed", e);
    await prisma.chunk.deleteMany({ where: { documentId: doc.id } });
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", errorMessage: "Could not process the transcript" },
    });
    return { id: doc.id, filename: doc.filename, status: "FAILED" as const };
  }
}