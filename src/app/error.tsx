"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the real error in the browser console to help with debugging
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden="true" />

      <div className="glass glow relative z-10 w-full max-w-md rounded-3xl p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
        </span>
        <h1 className="mt-5 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error happened. You can try again, or go back to your workspaces.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">Error code: {error.digest}</p>
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="bg-gradient-neon rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/documents"
            className="rounded-full border px-6 py-2.5 text-sm font-semibold transition hover:border-primary"
          >
            Go to workspaces
          </Link>
        </div>
      </div>
    </div>
  );
}