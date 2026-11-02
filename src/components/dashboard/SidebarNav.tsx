"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceItem = { id: string; name: string };

type Props = {
  workspaces: WorkspaceItem[];
  // Called when a link is clicked (the mobile drawer uses this to close itself)
  onNavigate?: () => void;
};

export default function SidebarNav({ workspaces, onNavigate }: Props) {
  const pathname = usePathname();

  const isAllActive = pathname === "/documents";
  const isWorkspaceActive = (id: string) =>
    pathname.startsWith(`/documents/${id}`) || pathname.startsWith(`/chat/${id}`);

  const linkClass = (active: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
      active
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <nav className="space-y-1" aria-label="Dashboard navigation">
      <Link href="/documents" onClick={onNavigate} className={linkClass(isAllActive)}>
        {isAllActive && (
          <span className="bg-gradient-neon absolute left-0 top-2 h-6 w-1 rounded-full" />
        )}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
        </svg>
        All workspaces
      </Link>

      <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your teams
      </p>

      {workspaces.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">No workspaces yet.</p>
      )}

      {workspaces.map((w) => {
        const active = isWorkspaceActive(w.id);
        return (
          <Link
            key={w.id}
            href={`/documents/${w.id}`}
            onClick={onNavigate}
            className={linkClass(active)}
          >
            {active && (
              <span className="bg-gradient-neon absolute left-0 top-2 h-6 w-1 rounded-full" />
            )}
            {/* Small square avatar with the first letter of the workspace name */}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                active ? "bg-gradient-neon text-white" : "bg-muted text-foreground"
              }`}
            >
              {w.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{w.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}