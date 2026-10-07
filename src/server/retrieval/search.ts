import { prisma } from "@/lib/db";
import { embedQuery } from "@/server/retrieval/embeddings"


export type SearchHit = {
    id: string;
    content: string;
    pageNumber: number;
    documentId: string;
    filename: string;
    score: number;
};

//Important is function call krne se pahle membership check krna padega
export async function searchChunks(
    workspaceId: string,
    question: string,
    limit: number = 5,
): Promise<SearchHit[]> {
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
        ORDER BY c.embedding <=> ${vec}::vector
        LIMIT ${limit}
    `;
}