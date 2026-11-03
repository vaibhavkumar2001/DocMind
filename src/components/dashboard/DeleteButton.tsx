"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ filename }: { filename: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Delete ${filename}`}
      title="Delete document"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
    >
      {pending ? (
        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
        </svg>
      )}
    </button>
  );
}

export default function DeleteButton({
  action,
  documentId,
  workspaceId,
  filename,
}: {
  action: (formData: FormData) => Promise<void>;
  documentId: string;
  workspaceId: string;
  filename: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${filename}"? This action cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton filename={filename} />
    </form>
  );
}