import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { saveTranscriptDocument, TranscriptError } from "@/server/transcripts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { workspaceId?: unknown; title?: unknown; url?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const workspaceId = String(body.workspaceId ?? "");
  if (!workspaceId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Most important check: is this user a member of this workspace?
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  try {
    const document = await saveTranscriptDocument({
      workspaceId: workspace.id,
      userId: user.id,
      title: String(body.title ?? ""),
      url: String(body.url ?? ""),
      transcript: String(body.transcript ?? ""),
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    if (e instanceof TranscriptError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[transcript] failed", e);
    return NextResponse.json({ error: "Could not add the transcript" }, { status: 500 });
  }
}