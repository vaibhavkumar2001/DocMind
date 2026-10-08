import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import {
  searchChunks,
  DEFAULT_MIN_SCORE,
  type SearchHit,
} from "@/server/retrieval/search";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ q?: string; min?: string }>;
}) {
  const { workspaceId } = await params;
  const { q, min } = await searchParams;
  const question = (q ?? "").trim().slice(0, 300);

  // yeh jo min h woh URL se aa rha h isko mujhe 1 aur 2 ke beech mein hi rakhna h
  const parsed = min === undefined || min === "" ? DEFAULT_MIN_SCORE : Number(min);
  const minScore = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : DEFAULT_MIN_SCORE;

  const user = await getOrCreateUser();
  if (!user) notFound();

  // Phele main membership check kraoonga phir search kroonga
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  let hits: SearchHit[] = [];
  let error: string | null = null;
  if (question) {
    try {
      hits = await searchChunks(workspace.id, question, { minScore });
    } catch (e) {
      console.error("[search] failed", e);
      error = "Search fail hua, thodi der baad try karo.";
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
        Only chunks with a score above the minimum threshold will be shown.
      </p>

      <form className="mt-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={question}
          placeholder="Apna sawaal likho..."
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
        />
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Min score
          <input
            name="min"
            type="number"
            step="0.05"
            min="0"
            max="1"
            defaultValue={minScore}
            className="w-20 rounded-lg border border-slate-300 bg-transparent px-2 py-2 dark:border-slate-700"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Search
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {question && !error && hits.length === 0 && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          No relevant answer was found in this workspace’s documents (minimum score: {minScore}). Try lowering the minimum score or upload READY documents
        </div>
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