"use client"

import {  useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className="text-xs text-slate-500 hover:text-shadow-red-600 disabled:opacity-50">
            {pending ? "Deleting..." : "Delete"}
        </button>
    )
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
        if (!confirm(`"${filename}" Are you sure you want to delete this? This action cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton />
    </form>
  );
}