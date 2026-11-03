"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gradient-neon rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create"}
    </button>
  );
}

export default function CreateWorkspaceForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        // Clear the input after the workspace is created
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <input
        name="name"
        required
        minLength={2}
        maxLength={50}
        placeholder="New workspace, e.g. Engineering team"
        className="flex-1 rounded-xl border border-input bg-muted px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
      <SubmitButton />
    </form>
  );
}