// Must be the first import, so env variables are loaded before the database client is created
import "dotenv/config";

import { Worker, UnrecoverableError } from "bullmq";
import { QUEUE_NAME, getRedisConnection, type IngestionJob } from "@/lib/queue";
import {
  PermanentIngestionError,
  markDocumentFailed,
  processFileDocument,
  processTranscriptDocument,
} from "@/server/ingestion/processDocument";

const worker = new Worker<IngestionJob>(
  QUEUE_NAME,
  async (job) => {
    console.log(`[worker] job ${job.id} (${job.data.kind}) started, attempt ${job.attemptsMade + 1}`);

    try {
      if (job.data.kind === "file") {
        await processFileDocument(job.data.documentId);
      } else {
        await processTranscriptDocument(job.data.documentId, job.data.transcript);
      }
    } catch (e) {
      // Problems that retrying cannot fix: show the reason to the user and stop retrying
      if (e instanceof PermanentIngestionError) {
        await markDocumentFailed(job.data.documentId, e.message);
        throw new UnrecoverableError(e.message);
      }
      throw e; // anything else is retried by BullMQ
    }
  },
  {
    connection: getRedisConnection(),
    // Two documents at a time keeps us inside the Gemini free-tier limits
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} finished`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`[worker] job ${job.id} failed: ${err.message}`);

  // "failed" = no retries left. "delayed" = BullMQ will try again later.
  const state = await job.getState();
  if (state === "failed") {
    await markDocumentFailed(
      job.data.documentId,
      "Processing failed. Please delete this file and upload it again.",
    );
  }
});

worker.on("error", (err) => {
  console.error("[worker] error", err);
});

console.log(`[worker] waiting for jobs on queue "${QUEUE_NAME}"...`);

// Finish the current job before exiting (Ctrl + C)
async function shutdown() {
  console.log("[worker] shutting down...");
  await worker.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);