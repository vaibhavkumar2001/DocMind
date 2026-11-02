import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { userButtonAppearance } from "@/lib/clerkAppearance";

type Props = {
  workspaceId: string;
  name: string;
  role?: string;
  active: "documents" | "chat";
};

export default function WorkspaceHeader({ workspaceId, name, role, active }: Props) {
  const tab = (isActive: boolean) =>
    `-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition ${
      isActive
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-2xl font-bold">{name}</h1>
          {role && (
            <span className="shrink-0 rounded-full border bg-accent px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-accent-foreground">
              {role}
            </span>
          )}
        </div>
        <UserButton appearance={userButtonAppearance} />
      </div>

      <nav className="mt-5 flex gap-6 border-b">
        <Link href={`/documents/${workspaceId}`} className={tab(active === "documents")}>
          Documents
        </Link>
        <Link href={`/chat/${workspaceId}`} className={tab(active === "chat")}>
          Chat
        </Link>
      </nav>
    </header>
  );
}