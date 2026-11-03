import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/server/user";
import { getUserWorkspaces } from "@/server/workspaces";
import { userButtonAppearance } from "@/lib/clerkAppearance";
import { createWorkspaceAction } from "./actions";
import CreateWorkspaceForm from '@/components/dashboard/CreateWorkspaceForm'
import DeleteWorkspaceButton from "@/components/dashboard/DeleteWorkspaceButton";

export default async function DocumentsPage() {
  const user = await getOrCreateUser();
  const workspaces = user ? await getUserWorkspaces(user.id) : [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Your workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {user?.name ?? user?.email}.
          </p>
        </div>
        <UserButton appearance={userButtonAppearance} />
      </div>

      {/* Create workspace */}
      <div className="glass mt-8 rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Create a new workspace</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A workspace keeps the documents and chats of one team or project together.
        </p>
        <div className="mt-4">
          <CreateWorkspaceForm action={createWorkspaceAction} />
        </div>
      </div>

      {/* Workspace list */}
      <div className="mt-8 flex items-center gap-3">
        <h2 className="text-lg font-semibold">All workspaces</h2>
        <span className="rounded-full border bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          {workspaces.length}
        </span>
      </div>

      {workspaces.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">No workspaces yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first workspace above to start uploading documents.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {workspaces.map((w) => {
            const role = w.members[0]?.role;
            return (
              <li
                key={w.id}
                className="glass group flex items-center gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-primary/60"
              >
                <Link href={`/documents/${w.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="bg-gradient-neon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white">
                    {w.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{w.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground transition group-hover:text-primary">
                      Open workspace &rarr;
                    </span>
                  </span>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  {role && (
                    <span className="rounded-full border bg-accent px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-accent-foreground">
                      {role}
                    </span>
                  )}
                  {role === "ADMIN" && (
                    <DeleteWorkspaceButton workspaceId={w.id} workspaceName={w.name} variant="icon" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}