import { prisma } from "@/lib/db";
import { parseTranscript, chunkSegments } from "@/server/ingestion/parseTranscript";
import { enqueueTranscriptIngestion } from "@/lib/queue";

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

  // Quick check so the user gets an instant error if nothing readable is inside.
  // The worker parses the transcript again for the real work.
  if (chunkSegments(parseTranscript(transcript)).length === 0) {
    throw new TranscriptError("No readable text found in the transcript");
  }

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
    await enqueueTranscriptIngestion(doc.id, transcript);
    return { id: doc.id, filename: doc.filename, status: "PROCESSING" as const };
  } catch (e) {
    console.error("[queue] could not enqueue the transcript", e);
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "FAILED",
        errorMessage: "Could not start processing. Please delete this item and try again.",
      },
    });
    return { id: doc.id, filename: doc.filename, status: "FAILED" as const };
  }
}