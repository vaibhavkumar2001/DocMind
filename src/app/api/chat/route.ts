import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { answerQuestion } from "@/server/llm/answer";
import { saveChatMessage, type StoredSource } from "@/server/chat";
import { isBusyError } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { workspaceId?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const workspaceId = String(body.workspaceId ?? "");
  const question = String(body.question ?? "").trim().slice(0, 500);
  if (!workspaceId || !question) {
    return NextResponse.json({ error: "Please write your question" }, { status: 400 });
  }

  // Most important check: is this user a member of this workspace?
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  try {
    const result = await answerQuestion(workspace.id, question);

    const sources: StoredSource[] = result.sources.map((s) => ({
      id: s.id,
      documentId: s.documentId,
      filename: s.filename,
      pageNumber: s.pageNumber,
      snippet: s.content.slice(0, 200),
    }));

    // Saving history must never block the answer
    try {
      await saveChatMessage({
        userId: user.id,
        workspaceId: workspace.id,
        question,
        answer: result.answer,
        sources,
      });
    } catch (e) {
      console.error("[chat] could not save history", e);
    }

    return NextResponse.json({ answer: result.answer, sources });
  } catch (e) {
    console.error("[chat] failed", e);
    if (isBusyError(e)) {
      return NextResponse.json(
        { error: "The AI model is busy right now. Please try again in a minute." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not generate an answer" }, { status: 500 });
  }
}