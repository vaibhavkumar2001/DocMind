import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import WorkspaceHeader from "@/components/dashboard/WorkspaceHeader";

export default async function WorkspaceChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const user = await getOrCreateUser();
  if (!user) notFound();

  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  return (
    <main className="mx-auto max-w-4xl p-8">
      <WorkspaceHeader
        workspaceId={workspace.id}
        name={workspace.name}
        role={workspace.members[0]?.role}
        active="chat"
      />

      <div className="mt-6 flex h-[60vh] flex-col rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
          Documents upload karo, phir yahan unse sawaal poocho.
        </div>
        <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <input
            disabled
            placeholder="Ask a question..."
            className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 opacity-60 dark:border-slate-700"
          />
          <button
            disabled
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}