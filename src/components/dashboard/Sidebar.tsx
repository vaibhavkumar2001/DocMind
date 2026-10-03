import Link from "next/link";
import { getOrCreateUser } from "@/server/user";
import { getUserWorkspaces } from "@/server/workspaces";


export default async function Sidebar() {
    const user = await getOrCreateUser()
    const workspaces = user ? await getUserWorkspaces(user.id) : []
    return (
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 p-4 md:block dark:border-slate-800">
      <Link href="/" className="text-lg font-bold">
        Doc<span className="text-indigo-600 dark:text-indigo-400">Mind</span>
      </Link>

      <nav className="mt-6 space-y-1 text-sm">
        <Link
          href="/documents"
          className="block rounded-lg px-3 py-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          All workspaces
        </Link>

        <p className="px-3 pt-4 text-xs text-slate-500">Your teams</p>
        {workspaces.map((w) => (
          <Link
            key={w.id}
            href={`/documents/${w.id}`}
            className="block truncate rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {w.name}
          </Link>
        ))}
      </nav>
    </aside>
    )
}