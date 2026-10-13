import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function gemini() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest";
// Optional: primary busy ho toh ye model try hoga
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 503 = model busy, 429 = limit: dono temporary ho sakte hain
function isBusy(e: unknown) {
  const status = (e as { status?: number })?.status;
  return status === 503 || status === 429;
}

export function isBusyError(e: unknown) {
  return isBusy(e);
}

export async function generateText(opts: {
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<string> {
  const models = [CHAT_MODEL];
  if (FALLBACK_MODEL && FALLBACK_MODEL !== CHAT_MODEL) models.push(FALLBACK_MODEL);

  let lastError: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await gemini().models.generateContent({
          model,
          contents: opts.prompt,
          config: { systemInstruction: opts.system, temperature: opts.temperature ?? 0.2 },
        });
        return res.text?.trim() ?? "";
      } catch (e) {
        lastError = e;
        if (!isBusy(e)) throw e; // doosri tarah ka error: retry ka fayda nahi
        console.warn(`[llm] ${model} busy (attempt ${attempt + 1}), retrying...`);
        await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
      }
    }
  }
  throw lastError;
}

export async function* streamText(opts: {
  system: string;
  prompt: string;
  temperature?: number;
}): AsyncGenerator<string> {
  const models = [CHAT_MODEL];
  if (FALLBACK_MODEL && FALLBACK_MODEL !== CHAT_MODEL) models.push(FALLBACK_MODEL);

  let lastError: unknown;
  for(const model of models) {
    for(let attempt = 0; attempt < 3; attempt++) {
      let started = false;
      try {
        const stream = await gemini().models.generateContentStream({
          model,
          contents: opts.prompt,
          config: { systemInstruction: opts.system, temperature: opts.temperature ?? 0.2 },
        });
        for await (const chunk of stream) {
          const piece = chunk.text;
          if(piece) {
            started = true;
            yield piece;
          }
        }
        return;
      } catch (e) {
        lastError = e;
        //ek baar agr text sent ho chuka h toh restart nhi hoga
        if(started || !isBusy(e)) throw e;
        console.warn(`[llm] ${model} busy (attempt ${attempt + 1}), retrying...`);
        await sleep(1000 * 2 ** attempt);
      }
    }
  }
  throw lastError;
}