import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq";

export const QUEUE_NAME = "ingestion";

// What a job carries. Files are re-read from storage by the worker,
// transcripts have no stored file, so their text travels inside the job.
export type IngestionJob =
  | { kind: "file"; documentId: string }
  | { kind: "transcript"; documentId: string; transcript: string };

// Turns REDIS_URL (redis://user:pass@host:6379) into BullMQ connection options
export function getRedisConnection(): ConnectionOptions {
  const raw = process.env.REDIS_URL;
  if (!raw) throw new Error("REDIS_URL is missing");

  const url = new URL(raw);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
  };
}

const jobOptions: JobsOptions = {
  attempts: 3, // retry temporary failures (for example Gemini 503)
  backoff: { type: "exponential", delay: 5000 }, // wait 5s, then 10s
  removeOnComplete: { age: 3600 }, // keep finished jobs for 1 hour
  removeOnFail: { age: 86400 }, // keep failed jobs for 1 day
};

// Reuse one Queue instance (Next.js dev reloads would otherwise open many connections)
const globalForQueue = globalThis as unknown as { ingestionQueue?: Queue<IngestionJob> };

function getQueue() {
  if (!globalForQueue.ingestionQueue) {
    globalForQueue.ingestionQueue = new Queue<IngestionJob>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: jobOptions,
    });
  }
  return globalForQueue.ingestionQueue;
}

// If Redis is down, fail after a few seconds instead of hanging the upload request
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Queue is not reachable")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function enqueueFileIngestion(documentId: string) {
  await withTimeout(
    getQueue().add("process-file", { kind: "file", documentId }, { jobId: documentId }),
    5000,
  );
}

export async function enqueueTranscriptIngestion(documentId: string, transcript: string) {
  await withTimeout(
    getQueue().add("process-transcript", { kind: "transcript", documentId, transcript }, { jobId: documentId }),
    5000,
  );
}