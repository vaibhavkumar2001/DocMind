import { prisma } from "@/lib/db";
import { deleteFromStorage } from "@/lib/storage";

export class WorkspaceDeleteError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "WorkspaceDeleteError";
  }
}

// Deletes a workspace and everything inside it. Only an ADMIN of that workspace can do this.
export async function deleteWorkspace(userId: string, workspaceId: string) {
  // 1) Membership and role check
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });

  if (!membership) {
    throw new WorkspaceDeleteError("Workspace not found.", 404);
  }
  if (membership.role !== "ADMIN") {
    throw new WorkspaceDeleteError("Only an admin can delete this workspace.", 403);
  }

  // 2) Remember the storage paths before the rows disappear
  const docs = await prisma.document.findMany({
    where: { workspaceId, storagePath: { not: null } },
    select: { storagePath: true },
  });
  const paths = docs
    .map((d) => d.storagePath)
    .filter((p): p is string => typeof p === "string");

  // 3) Delete the workspace. Cascade removes members, documents, chunks and chat messages.
  await prisma.workspace.delete({ where: { id: workspaceId } });

  // 4) Best-effort cleanup of the stored files. The database is already clean at this point,
  //    so one failed file must not turn the whole request into an error.
  const results = await Promise.allSettled(paths.map((p) => deleteFromStorage(p)));
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.error(`Workspace ${workspaceId}: ${failed} stored file(s) could not be deleted.`);
  }
}