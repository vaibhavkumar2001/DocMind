"use client";

import { useRef, useState } from "react";

const MAX_MB = 10;
const ALLOWED = [".pdf", ".docx", ".txt"];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function UploadBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function addFiles(list: FileList | File[]) {
    const ok: File[] = [];
    const bad: string[] = [];

    for (const f of Array.from(list)) {
      const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED.includes(ext)) {
        bad.push(`${f.name}: sirf PDF, DOCX ya TXT allowed hai`);
      } else if (f.size > MAX_MB * 1024 * 1024) {
        bad.push(`${f.name}: ${MAX_MB} MB se bada hai`);
      } else {
        ok.push(f);
      }
    }

    setFiles((prev) => [...prev, ...ok]);
    setErrors(bad);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <p className="font-medium">Drop files here, or click to select them.</p>
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
            e.target.value = ""; // same file dobara chun sakein
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

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-slate-800"
            >
              <span className="truncate">
                {f.name} <span className="text-slate-500">({formatSize(f.size)})</span>
              </span>
              <button
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-slate-500 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        disabled
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white opacity-50"
      >
        Upload (Day 7 mein chalega)
      </button>
    </div>
  );
}