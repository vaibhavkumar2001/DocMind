import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/server/user";
import { deleteWorkspace, WorkspaceDeleteError } from "@/server/workspaceDelete";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  try {
    await deleteWorkspace(user.id, workspaceId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof WorkspaceDeleteError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Workspace delete failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while deleting the workspace." },
      { status: 500 },
    );
  }
}