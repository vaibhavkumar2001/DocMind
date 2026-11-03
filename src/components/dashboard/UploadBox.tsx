"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSize } from "@/lib/utils";

const MAX_MB = 8;
const ALLOWED = [".pdf", ".docx", ".txt"];

type Item = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  message?: string;
};

export default function UploadBox({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function update(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function addFiles(list: FileList | File[]) {
    const ok: Item[] = [];
    const bad: string[] = [];
    for (const f of Array.from(list)) {
      const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED.includes(ext)) bad.push(`${f.name}: only PDF, DOCX or TXT files are allowed`);
      else if (f.size > MAX_MB * 1024 * 1024) bad.push(`${f.name}: larger than ${MAX_MB} MB`);
      else ok.push({ id: crypto.randomUUID(), file: f, status: "queued" });
    }
    setItems((prev) => [...prev, ...ok]);
    setErrors(bad);
  }

  async function uploadAll() {
    setBusy(true);
    const todo = items.filter((i) => i.status === "queued" || i.status === "error");
    for (const item of todo) {
      update(item.id, { status: "uploading", message: undefined });
      try {
        const fd = new FormData();
        fd.append("workspaceId", workspaceId);
        fd.append("file", item.file);
        const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        update(item.id, { status: "done" });
      } catch (e) {
        update(item.id, {
          status: "error",
          message: e instanceof Error ? e.message : "Upload failed",
        });
      }
    }
    setBusy(false);
    // Remove the finished files from the queue
    setItems((prev) => prev.filter((i) => i.status !== "done"));
    // Ask the server for the fresh documents list
    router.refresh();
  }

  const pending = items.filter((i) => i.status !== "done").length;

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-primary bg-accent glow"
            : "bg-muted/40 hover:border-primary/60 hover:bg-muted/70"
        }`}
      >
        <span className="bg-gradient-neon mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
          </svg>
        </span>
        <p className="mt-4 font-medium">
          {dragging ? "Drop your files now" : "Drop files here, or click to select them"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, DOCX or TXT, max {MAX_MB} MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.map((er) => (
            <li key={er}>{er}</li>
          ))}
        </ul>
      )}

      {/* Queue */}
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{i.file.name}</span>
                <span className="text-xs text-muted-foreground">{formatSize(i.file.size)}</span>
                {i.message && <span className="ml-2 text-xs text-destructive">{i.message}</span>}
              </span>

              <span className="shrink-0 text-xs text-muted-foreground">
                {i.status === "uploading" ? (
                  <span className="flex items-center gap-2 text-primary">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                    className="rounded-md px-2 py-1 transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={uploadAll}
        disabled={busy || pending === 0}
        className="bg-gradient-neon mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Uploading..." : `Upload${pending ? ` (${pending})` : ""}`}
      </button>
    </div>
  );
}