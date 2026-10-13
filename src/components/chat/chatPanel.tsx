"use client";

import { useEffect, useRef, useState } from "react";

type Source = {
  id: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  snippet: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  isError?: boolean;
};

export default function ChatPanel({
  workspaceId,
  initialMessages = [],
}: {
  workspaceId: string;
  initialMessages?: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: err instanceof Error ? err.message : "Something went wrong",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            Ask anything from your documents. Each answer will include its source.
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className="max-w-[85%]">
                <div
                  className={`whitespace-pre-wrap rounded-2xl rounded-bl-sm px-4 py-2 ${
                    m.isError
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {m.text}
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((s, i) => {
                      const cited = m.text.includes(`[${i + 1}]`);
                      return (
                        <a
                          key={s.id}
                          href={`/api/documents/${s.documentId}/open?page=${s.pageNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.snippet}
                          className={`rounded-md border px-2 py-1 text-xs hover:underline ${
                            cited
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                              : "border-slate-200 text-slate-500 dark:border-slate-700"
                          }`}
                        >
                          [{i + 1}] {s.filename}, p.{s.pageNumber}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-slate-500 dark:bg-slate-800">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          disabled={loading}
          placeholder="Apna sawaal likho..."
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}