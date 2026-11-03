"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Props = {
  workspaceId: string;
  workspaceName: string;
  // "pill" = text button (workspace header), "icon" = small trash icon (workspace cards)
  variant?: "pill" | "icon";
};

const TRASH_ICON = "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5";

export default function DeleteWorkspaceButton({
  workspaceId,
  workspaceName,
  variant = "pill",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = typed.trim() === workspaceName.trim() && !deleting;

  function close() {
    if (deleting) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        setOpen(false);
        setTyped("");
        setError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, deleting]);

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete the workspace.");
      }
      // Go back to the list; refresh so the sidebar no longer shows the deleted workspace
      router.push("/documents");
      router.refresh();
      setOpen(false);
      setTyped("");
      setDeleting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the workspace.");
      setDeleting(false);
    }
  }

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete workspace ${workspaceName}`}
        title="Delete workspace"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={TRASH_ICON} />
        </svg>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={TRASH_ICON} />
        </svg>
        <span className="hidden sm:inline">Delete workspace</span>
        <span className="sm:hidden">Delete</span>
      </button>
    );

  const dialog = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-ws-title"
        >
          {/* Backdrop: click to close */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl">
            <h2 id="delete-ws-title" className="text-lg font-bold">
              Delete this workspace?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{workspaceName}</span>, including all
              its documents, transcripts and chat history. This cannot be undone.
            </p>

            <label htmlFor="confirm-name" className="mt-5 block text-sm font-medium">
              Type <span className="font-mono text-destructive">{workspaceName}</span> to confirm
            </label>
            <input
              id="confirm-name"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={deleting}
              autoComplete="off"
              autoFocus
              className="mt-2 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder={workspaceName}
            />

            {error && (
              <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={deleting}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger}
      {dialog}
    </>
  );
}