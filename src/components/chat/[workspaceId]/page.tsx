import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { getChatHistory, type StoredSource } from "@/server/chat";
import WorkspaceHeader from "@/components/dashboard/WorkspaceHeader";
import ChatPanel, { type Message } from '@/components/chat/chatPanel'

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
    // Phones: subtract the mobile top bar height. Desktop: the sidebar is beside the page, so full height.
    <main className="mx-auto flex h-[calc(100dvh-4.1rem)] max-w-4xl flex-col px-5 py-5 sm:px-8 md:h-dvh md:py-8">
      <WorkspaceHeader
        workspaceId={workspace.id}
        name={workspace.name}
        role={workspace.members[0]?.role}
        active="chat"
      />

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <ChatPanel workspaceId={workspace.id} initialMessages={initialMessages} />
      </div>
    </main>
  );
}