import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { getChatHistory, type StoredSource } from "@/server/chat";
import WorkspaceHeader from "@/components/dashboard/WorkspaceHeader";
import ChatPanel, { type Message } from "@/components/chat/chatPanel";

export default async function WorkspaceChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const user = await getOrCreateUser();
  if (!user) notFound();

  // Only members of the workspace can open its chat
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  // Turn each saved row (question + answer) into two chat bubbles
  const history = await getChatHistory(user.id, workspace.id);
  const initialMessages: Message[] = history.flatMap((row) => [
    { id: `${row.id}-q`, role: "user" as const, text: row.question },
    {
      id: `${row.id}-a`,
      role: "assistant" as const,
      text: row.answer,
      sources: (row.sources as StoredSource[] | null) ?? [],
    },
  ]);

  return (
    <main className="mx-auto flex h-screen max-w-4xl flex-col p-8">
      <WorkspaceHeader
        workspaceId={workspace.id}
        name={workspace.name}
        role={workspace.members[0]?.role}
        active="chat"
      />

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <ChatPanel workspaceId={workspace.id} initialMessages={initialMessages} />
      </div>
    </main>
  );
}