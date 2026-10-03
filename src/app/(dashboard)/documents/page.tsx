import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/server/user";
import { getUserWorkspaces } from "@/server/workspaces";
import { createWorkspaceAction } from "./actions";

export default async function DocumentsPage() {
  const user = await getOrCreateUser();
  const workspaces = user ? await getUserWorkspaces(user.id) : [];

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your workspaces</h1>
        <UserButton />
      </div>
      <p className="mt-1 text-slate-500">
        Welcome, {user?.name ?? user?.email}.
      </p>

      <form action={createWorkspaceAction} className="mt-6 flex gap-2">
        <input
          name="name"
          required
          minLength={2}
          maxLength={50}
          placeholder="Naya workspace, jaise Engineering team"
          className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Create
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {workspaces.length === 0 && (
          <li className="text-slate-500">There is no workspace yet. Create one from scratch.</li>
        )}
        {workspaces.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800"
          >
            <span className="font-medium">{w.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              {w.members[0]?.role}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}