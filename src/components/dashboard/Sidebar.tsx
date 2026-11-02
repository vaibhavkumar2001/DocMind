import Link from "next/link";
import { getOrCreateUser } from "@/server/user";
import { getUserWorkspaces } from "@/server/workspaces";
import SidebarNav from "./SidebarNav";
import MobileNav from "./MobileNav";
import ThemeToggle from "@/components/UI/ThemeToggle";

export default async function Sidebar() {
  const user = await getOrCreateUser();
  const workspaces = user ? await getUserWorkspaces(user.id) : [];

  // Send only the fields the client components need
  const items = workspaces.map((w) => ({ id: w.id, name: w.name }));

  return (
    <>
      {/* Phones: top bar + slide-in drawer */}
      <MobileNav workspaces={items} />

      {/* Desktop: fixed sidebar that stays in place while the page scrolls */}
      <aside className="sticky top-0 z-10 hidden h-screen w-64 shrink-0 flex-col border-r bg-background/60 p-4 backdrop-blur-xl md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-1">
          <span className="bg-gradient-neon glow flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white">
            D
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">DocMind</span>
        </Link>

        <div className="mt-8 flex-1 overflow-y-auto">
          <SidebarNav workspaces={items} />
        </div>

        {/* Bottom: theme switch */}
        <div className="flex items-center justify-between border-t pt-4">
          <span className="px-1 text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}