import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { saveUploadedDocument, validateFile, UploadError } from "@/server/documents";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const workspaceId = String(form.get("workspaceId") ?? "");
  const file = form.get("file");

  if (!workspaceId || !(file instanceof File)) {
    return NextResponse.json({ error: "workspaceId aur file chahiye" }, { status: 400 });
  }

  // Sabse zaroori check: kya ye user is workspace ka member hai?
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const problem = validateFile(file);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    const doc = await saveUploadedDocument({ workspaceId, userId: user.id, file });
    return NextResponse.json(
      { document: { id: doc.id, filename: doc.filename, status: doc.status } },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}