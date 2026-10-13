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
  streaming?: boolean;
};

type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

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

  // Keep the latest message in view while the answer grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function patch(id: string, change: (m: Message) => Message) {
    setMessages((prev) => prev.map((m) => (m.id === id ? change(m) : m)));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const answerId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: question },
      { id: answerId, role: "assistant", text: "", streaming: true },
    ]);
    setInput("");
    setLoading(true);

    const fail = (message: string) =>
      patch(answerId, (m) => ({ ...m, text: message, isError: true, streaming: false }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, question }),
      });

      // Errors before streaming starts come back as plain JSON
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        fail(data.error ?? "Something went wrong");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handle = (event: StreamEvent) => {
        if (event.type === "sources") {
          patch(answerId, (m) => ({ ...m, sources: event.sources }));
        } else if (event.type === "token") {
          patch(answerId, (m) => ({ ...m, text: m.text + event.text }));
        } else if (event.type === "error") {
          fail(event.message);
        } else if (event.type === "done") {
          patch(answerId, (m) => ({ ...m, streaming: false }));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Each complete line is one event; keep the unfinished tail for next time
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handle(JSON.parse(line) as StreamEvent);
          } catch {
            // ignore a broken line
          }
        }
      }

      // Safety net: if the stream ended without a "done" event
      patch(answerId, (m) => ({ ...m, streaming: false }));
    } catch {
      fail("Connection lost. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            Ask anything about your documents. Every answer comes with its sources.
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
                {/* The answer is rendered as plain text (React escapes it), never as HTML */}
                <div
                  className={`whitespace-pre-wrap rounded-2xl rounded-bl-sm px-4 py-2 ${
                    m.isError
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {m.text ||
                    (m.streaming ? <span className="animate-pulse text-slate-500">Thinking...</span> : "")}
                  {m.streaming && m.text && <span className="animate-pulse">▍</span>}
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.map((s, i) => {
                      // Highlight the sources the answer actually cites, like [1] or [2]
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
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          disabled={loading}
          placeholder="Type your question..."
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