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

      if (data.document?.status === "READY") {
        setMessage({ ok: true, text: "Transcript added and ready to search." });
        setTitle("");
        setUrl("");
        setTranscript("");
      } else {
        setMessage({ ok: false, text: "The transcript was saved but could not be processed." });
      }
      router.refresh(); // reload the documents list
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700";

  return (
    <details className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <summary className="px-4 py-3 text-sm font-semibold">Add a video transcript</summary>

      <form onSubmit={submit} className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
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
          className={field}
        />
        <p className="text-xs text-slate-500">
          Timestamps at the start of a line (0:45 or [12:30]) or SRT/VTT text give clickable times in
          citations. A transcript without timestamps also works.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Processing..." : "Add transcript"}
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}