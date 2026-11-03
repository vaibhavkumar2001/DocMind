"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/chat/Markdown";
import { formatTimestamp } from "@/lib/time"

type Source = {
  id: string;
  documentId: string;
  filename: string;
  pageNumber: number;
  snippet: string;
  // Only video sources have these two
  startSeconds?: number | null;
  sourceType?: string | null;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  isError?: boolean;
  streaming?: boolean;
  stopped?: boolean;
  // set on error bubbles so the Retry button knows what to resend
  retry?: { question: string; userMessageId: string };
};

type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

// Starter questions shown on an empty chat
const STARTERS = [
  "Summarize the main points of my documents",
  "What are the key takeaways?",
  "List any deadlines, numbers or dates mentioned",
];

function isVideoSource(s: Source) {
  return s.sourceType === "VIDEO";
}

// Videos open at the cited time, files open at the cited page
function sourceHref(s: Source) {
  const base = `/api/documents/${s.documentId}/open`;
  if (isVideoSource(s)) {
    return typeof s.startSeconds === "number" ? `${base}?t=${s.startSeconds}` : base;
  }
  return `${base}?page=${s.pageNumber}`;
}

function sourceLabel(s: Source) {
  if (isVideoSource(s)) {
    return typeof s.startSeconds === "number"
      ? `${s.filename}, ${formatTimestamp(s.startSeconds)}`
      : s.filename;
  }
  return `${s.filename}, p.${s.pageNumber}`;
}

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
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // true while the user is near the bottom; only then do we auto-scroll
  const stickRef = useRef(true);
  // skip the auto-focus on first render (it would pop the keyboard open on phones)
  const firstRenderRef = useRef(true);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight; // instant, no smooth animation (avoids jitter)
  }

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = atBottom;
    setShowJump(!atBottom);
  }

  // Follow the answer as it grows, but only if the user has not scrolled up
  useEffect(() => {
    if (stickRef.current) scrollToBottom();
  }, [messages]);

  // Put the cursor back in the input when an answer finishes
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  // Cancel any running request if the user leaves the page
  useEffect(() => () => abortRef.current?.abort(), []);

  function patch(id: string, change: (m: Message) => Message) {
    setMessages((prev) => prev.map((m) => (m.id === id ? change(m) : m)));
  }

  async function ask(question: string) {
    if (loading) return;

    const userMessageId = crypto.randomUUID();
    const answerId = crypto.randomUUID();
    stickRef.current = true; // a new question always jumps to the bottom
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
      { id: answerId, role: "assistant", text: "", streaming: true },
    ]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const fail = (message: string) =>
      patch(answerId, (m) => ({
        ...m,
        text: message,
        isError: true,
        streaming: false,
        retry: { question, userMessageId },
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, question }),
        signal: controller.signal,
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
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // The user pressed Stop: keep whatever text we already have
        patch(answerId, (m) => ({ ...m, streaming: false, stopped: true }));
      } else {
        fail("Connection lost. Please try again.");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    void ask(question);
  }

  function retry(m: Message) {
    if (!m.retry || loading) return;
    const { question, userMessageId } = m.retry;
    // Remove the failed pair, then ask again
    setMessages((prev) => prev.filter((x) => x.id !== m.id && x.id !== userMessageId));
    void ask(question);
  }

  return (
    <div className="glass relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {/* Empty state with starter questions */}
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-2 text-center">
            <span className="bg-gradient-neon glow flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white">
              D
            </span>
            <h2 className="mt-5 text-xl font-bold">Ask your documents</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Every answer comes with its sources, so you can click and verify it.
            </p>
            <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void ask(q)}
                  disabled={loading}
                  className="rounded-full border bg-card/60 px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="bg-gradient-neon max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white sm:max-w-[75%]">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-3">
              <span className="bg-gradient-neon mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white">
                D
              </span>

              <div className="min-w-0 max-w-[90%]">
                {/* Answers are rendered as sanitized Markdown (no raw HTML, no images) */}
                <div
                  className={`break-words rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-relaxed ${
                    m.isError
                      ? "whitespace-pre-wrap border-destructive/40 bg-destructive/10 text-destructive"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  {!m.text ? (
                    m.streaming ? (
                      <span className="flex items-center gap-1.5 py-1 text-muted-foreground" aria-label="Thinking">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                      </span>
                    ) : m.stopped ? (
                      <span className="text-muted-foreground">Stopped.</span>
                    ) : null
                  ) : m.isError ? (
                    m.text
                  ) : (
                    <Markdown text={m.text} />
                  )}
                  {m.streaming && m.text && <span className="animate-pulse text-primary">▍</span>}
                  {m.stopped && m.text && (
                    <span className="mt-2 block text-xs text-muted-foreground">Stopped</span>
                  )}
                </div>

                {m.isError && m.retry && (
                  <button
                    type="button"
                    onClick={() => retry(m)}
                    disabled={loading}
                    className="mt-2 rounded-full border px-3 py-1 text-xs font-medium transition hover:border-primary hover:bg-muted disabled:opacity-50"
                  >
                    Retry
                  </button>
                )}

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.sources.map((s, i) => {
                      // Highlight the sources the answer actually cites, like [1] or [2]
                      const cited = m.text.includes(`[${i + 1}]`);
                      return (
                        <a
                          key={s.id}
                          href={sourceHref(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={s.snippet}
                          className={`max-w-full truncate rounded-full border px-3 py-1 text-xs font-medium transition hover:border-primary ${
                            cited
                              ? "border-primary/50 bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          [{i + 1}] {sourceLabel(s)}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => {
            stickRef.current = true;
            setShowJump(false);
            scrollToBottom();
          }}
          className="glass absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-xs font-medium shadow-lg transition hover:border-primary"
        >
          ↓ Latest
        </button>
      )}

      {/* Input bar */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t bg-background/40 p-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          disabled={loading}
          placeholder="Type your question..."
          className="min-w-0 flex-1 rounded-full border border-input bg-muted px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
        />
        {loading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            aria-label="Stop generating"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:border-destructive hover:text-destructive"
          >
            <span className="h-3 w-3 rounded-sm bg-current" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send question"
            className="bg-gradient-neon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}