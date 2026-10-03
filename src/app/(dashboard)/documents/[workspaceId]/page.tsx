import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";

export default async function WorkspacePage({
    params,
}: {
    params: Promise <{ workspaceId: string }>
}) {
    const { workspaceId } = await params;
    
    const user = await getOrCreateUser();
    if(!user) notFound();

    //Maine workspace ke liye uske user aur workspace ki id find krli h 
    const workspace = await getWorkspaceForUser(user.id, workspaceId);
    if(!workspace) notFound();

    return (
        <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <Link href="/documents" className="text-sm text-indigo-600 hover:underline">
          &larr; All workspaces
        </Link>
        <UserButton />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
          {workspace.members[0]?.role}
        </span>
      </div>

      <p className="mt-6 text-slate-500">
        The documents for this workspace will be displayed here.
      </p>
    </main>
    )
}