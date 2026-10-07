import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { searchChunks, type SearchHit } from "@/server/retrieval/search";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { workspaceId } = await params;
  const { q } = await searchParams;
  const question = (q ?? "").trim().slice(0, 300);

  const user = await getOrCreateUser();
  if (!user) notFound();

  // Pehle membership check, phir search
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  let hits: SearchHit[] = [];
  let error: string | null = null;
  if (question) {
    try {
      hits = await searchChunks(workspace.id, question);
    } catch (e) {
      console.error("[search] failed", e);
      error = "Search failed. Please try again in a little while.";
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href={`/documents/${workspace.id}`}
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; {workspace.name}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Search (test)</h1>
      <p className="mt-1 text-sm text-slate-500">
        For now, only matching chunks will be shown. The LLM-generated answer will be added in Week 5.
      </p>

      <form className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={question}
          placeholder="Type Your Question..."
          className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {question && !error && hits.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          No chunks found. Have you uploaded any READY documents?
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {hits.map((h) => (
          <li
            key={h.id}
            className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium">
                {h.filename}{" "}
                <span className="font-normal text-slate-500">page {h.pageNumber}</span>
              </p>
              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                score {h.score.toFixed(3)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-400">
              {h.content.length > 400 ? h.content.slice(0, 400) + "..." : h.content}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}