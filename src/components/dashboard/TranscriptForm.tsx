"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TranscriptForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);

    try {
      const res = await fetch("/api/documents/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, title, url, transcript }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      if (data.document?.status === "FAILED") {
        setMessage({ ok: false, text: "The transcript was saved but could not be processed." });
      } else {
        setMessage({
          ok: true,
          text: "Transcript added. It is being processed and will be ready shortly.",
        });
        setTitle("");
        setUrl("");
        setTranscript("");
      }
      router.refresh(); // reload the documents list
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-input bg-muted px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <details className="glass group mt-6 rounded-2xl open:border-primary/60">
      <summary className="flex list-none items-center gap-3 px-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 10l5-3v10l-5-3M4 6h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" />
          </svg>
        </span>
        Add a video transcript
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto text-muted-foreground transition-transform duration-200 group-open:rotate-90"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </summary>

      <form onSubmit={submit} className="space-y-3 border-t p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          placeholder="Video title"
          className={field}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          required
          placeholder="Video link (https://...)"
          className={field}
        />
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          maxLength={200000}
          required
          rows={8}
          placeholder="Paste the transcript here"
          className={`${field} resize-y`}
        />
        <p className="text-xs text-muted-foreground">
          Timestamps at the start of a line (0:45 or [12:30]) or SRT/VTT text give clickable times in
          citations. A transcript without timestamps also works.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="bg-gradient-neon rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Processing..." : "Add transcript"}
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? "text-success" : "text-destructive"}`}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}