"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SidebarNav, { type WorkspaceItem } from "./SidebarNav";
import ThemeToggle from "@/components/UI/ThemeToggle";

export default function MobileNav({ workspaces }: { workspaces: WorkspaceItem[] }) {
  const [open, setOpen] = useState(false);

  // Close on Escape and lock page scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {/* Top bar (phones and small tablets only) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/70 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-neon flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
            D
          </span>
          <span className="font-display font-semibold tracking-tight">DocMind</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          {/* Dark backdrop: click to close */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r bg-background p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="bg-gradient-neon flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
                  D
                </span>
                <span className="font-display font-semibold tracking-tight">DocMind</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              <SidebarNav workspaces={workspaces} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}