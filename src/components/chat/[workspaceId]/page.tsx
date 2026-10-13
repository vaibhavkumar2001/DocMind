import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import ChatPanel from "@/components/chat/chatPanel";

export default async function ChatPage({
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
    <main className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/documents/${workspace.id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; {workspace.name} (documents)
        </Link>
        <UserButton />
      </div>
      <h1 className="mt-3 mb-4 text-2xl font-bold">Chat</h1>

      <div className="min-h-0 flex-1">
        <ChatPanel workspaceId={workspace.id} />
      </div>
    </main>
  );
}