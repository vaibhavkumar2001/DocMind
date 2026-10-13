import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { streamAnswer, NOT_FOUND } from "@/server/llm/answer";
import { saveChatMessage, type StoredSource } from "@/server/chat";
import { isBusyError } from "@/lib/gemini";

export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return json({ error: "Not signed in" }, 401);

  let body: { workspaceId?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const workspaceId = String(body.workspaceId ?? "");
  const question = String(body.question ?? "").trim().slice(0, 500);
  if (!workspaceId || !question) return json({ error: "Please write your question" }, 400);

  // Most important check: is this user a member of this workspace?
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) return json({ error: "Workspace not found" }, 404);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // One JSON event per line (NDJSON)
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        const { sources, tokens } = await streamAnswer(workspace.id, question);

        const storedSources: StoredSource[] = sources.map((s) => ({
          id: s.id,
          documentId: s.documentId,
          filename: s.filename,
          pageNumber: s.pageNumber,
          snippet: s.content.slice(0, 200),
        }));
        send({ type: "sources", sources: storedSources });

        let full = "";
        if (tokens) {
          for await (const piece of tokens) {
            if (req.signal.aborted) return; // the user left, stop working
            full += piece;
            send({ type: "token", text: piece });
          }
        }

        if (!full.trim()) {
          full = NOT_FOUND;
          send({ type: "token", text: full });
        }

        // Saving history must never block or break the answer
        try {
          await saveChatMessage({
            userId: user.id,
            workspaceId: workspace.id,
            question,
            answer: full,
            sources: storedSources,
          });
        } catch (e) {
          console.error("[chat] could not save history", e);
        }

        send({ type: "done" });
      } catch (e) {
        console.error("[chat] failed", e);
        send({
          type: "error",
          message: isBusyError(e)
            ? "The AI model is busy right now. Please try again in a minute."
            : "Could not generate an answer",
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed (client disconnected)
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}