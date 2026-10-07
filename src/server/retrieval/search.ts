import { prisma } from "@/lib/db";
import { embedQuery } from "@/server/retrieval/embeddings";

export type SearchHit = {
  id: string;
  content: string;
  pageNumber: number;
  documentId: string;
  filename: string;
  score: number;
};

// Ye number naapke tune karenge (Week 9 mein eval set se pakka karenge)
export const DEFAULT_MIN_SCORE = 0.5;

// Dhyan: is function ko bulane se PEHLE caller ko membership check karna hai
export async function searchChunks(
  workspaceId: string,
  question: string,
  opts: { limit?: number; minScore?: number } = {},
): Promise<SearchHit[]> {
  const limit = opts.limit ?? 5;
  const minScore = opts.minScore ?? DEFAULT_MIN_SCORE;
  const vec = JSON.stringify(await embedQuery(question));

  return prisma.$queryRaw<SearchHit[]>`
    SELECT c.id,
           c.content,
           c."pageNumber",
           c."documentId",
           d.filename,
           1 - (c.embedding <=> ${vec}::vector) AS score
    FROM "Chunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c."workspaceId" = ${workspaceId}
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${vec}::vector) >= ${minScore}::float8
    ORDER BY c.embedding <=> ${vec}::vector
    LIMIT ${limit}
  `;
}