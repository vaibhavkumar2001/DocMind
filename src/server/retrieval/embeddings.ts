import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";

const MODEL = "gemini-embedding-001";
const DIMS = 768; // schema ke vector(768) se match hona chahiye
const API_BATCH = 50;
const DB_BATCH = 50;

let client: GoogleGenAI | null = null;
function ai() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

async function embed(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += API_BATCH) {
    const batch = texts.slice(i, i + API_BATCH);
    const res = await ai().models.embedContent({
      model: MODEL,
      contents: batch,
      config: { taskType, outputDimensionality: DIMS },
    });

    const vectors = res.embeddings ?? [];
    if (vectors.length !== batch.length) {
      throw new Error("Embedding count mismatch");
    }
    for (const v of vectors) {
      const values = v.values ?? [];
      if (values.length !== DIMS) throw new Error(`Expected ${DIMS} dims, got ${values.length}`);
      out.push(values);
    }
  }
  return out;
}

// Document ke chunks ke liye
export function embedDocuments(texts: string[]) {
  return embed(texts, "RETRIEVAL_DOCUMENT");
}

// User ke sawaal ke liye 
export async function embedQuery(question: string) {
  return (await embed([question], "RETRIEVAL_QUERY"))[0];
}

// Vectors ko Chunk table mein likho (Prisma vector type nahi samajhta, isliye raw SQL)
export async function saveEmbeddings(ids: string[], vectors: number[][]) {
  for (let i = 0; i < ids.length; i += DB_BATCH) {
    const idSlice = ids.slice(i, i + DB_BATCH);
    const vecSlice = vectors.slice(i, i + DB_BATCH).map((v) => JSON.stringify(v));

    await prisma.$executeRaw`
      UPDATE "Chunk" AS c
      SET "embedding" = v.emb::vector
      FROM (
        SELECT unnest(${idSlice}::text[]) AS id,
               unnest(${vecSlice}::text[]) AS emb
      ) AS v
      WHERE c.id = v.id
    `;
  }
}