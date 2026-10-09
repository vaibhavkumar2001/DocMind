import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { answerQuestion, type Answer } from "@/server/llm/answer";

export default async function AskPage({
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

  // Pehle membership check, phir LLM
  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  let result: Answer | null = null;
  let error: string | null = null;
  if (question) {
    try {
      result = await answerQuestion(workspace.id, question);
    } catch (e) {
      console.error("[ask] failed", e);
      error = "Jawab banane mein dikkat aayi, thodi der baad try karo.";
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
      <h1 className="mt-4 text-2xl font-bold">Ask (test)</h1>

      <form className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={question}
          placeholder="Apne documents se kuch poochho..."
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        >
          Ask
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <>
          <div className="mt-6 whitespace-pre-line rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950">
            {result.answer}
          </div>

          {result.sources.length > 0 && (
            <>
              <h2 className="mt-6 text-sm font-semibold text-slate-500">Sources</h2>
              <ul className="mt-2 space-y-2">
                {result.sources.map((s, i) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"
                  >
                    <p className="font-medium">
                      [{i + 1}] {s.filename}{" "}
                      <span className="font-normal text-slate-500">
                        page {s.pageNumber} · score {s.score.toFixed(3)}
                      </span>
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      {s.content.length > 200 ? s.content.slice(0, 200) + "..." : s.content}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}