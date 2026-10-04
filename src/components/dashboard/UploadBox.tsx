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
      if (!ALLOWED.includes(ext)) bad.push(`${f.name}: sirf PDF, DOCX ya TXT allowed hai`);
      else if (f.size > MAX_MB * 1024 * 1024) bad.push(`${f.name}: ${MAX_MB} MB se bada hai`);
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
        if (!res.ok) throw new Error(data.error ?? "Upload fail hua");
        update(item.id, { status: "done" });
      } catch (e) {
        update(item.id, {
          status: "error",
          message: e instanceof Error ? e.message : "Upload fail hua",
        });
      }
    }
    setBusy(false);
    setItems((prev) => prev.filter((i) => i.status !== "done")); // ho gaye wale list se hata do
    router.refresh(); // server se nayi documents list mangwao
  }

  const pending = items.filter((i) => i.status !== "done").length;

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
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
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <p className="font-medium">Files yahan drop karo, ya click karke chuno</p>
        <p className="mt-1 text-sm text-slate-500">
          PDF, DOCX ya TXT, max {MAX_MB} MB per file
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

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-red-600">
          {errors.map((er) => (
            <li key={er}>{er}</li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-800"
            >
              <span className="truncate">
                {i.file.name}{" "}
                <span className="text-slate-500">({formatSize(i.file.size)})</span>
                {i.message && <span className="ml-2 text-red-600">{i.message}</span>}
              </span>
              <span className="shrink-0 text-slate-500">
                {i.status === "uploading" ? (
                  "Uploading..."
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                    className="hover:text-red-600"
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
        onClick={uploadAll}
        disabled={busy || pending === 0}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Uploading..." : `Upload${pending ? ` (${pending})` : ""}`}
      </button>
    </div>
  );
}