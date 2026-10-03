import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type Props = {
  workspaceId: string;
  name: string;
  role?: string;
  active: "documents" | "chat";
};

export default function WorkspaceHeader({ workspaceId, name, role, active }: Props) {
  const tab = (isActive: boolean) =>
    `border-b-2 px-1 pb-2 text-sm font-medium ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
    }`;

  return (
    <header>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{name}</h1>
          {role && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              {role}
            </span>
          )}
        </div>
        <UserButton />
      </div>

      <nav className="mt-4 flex gap-6 border-b border-slate-200 dark:border-slate-800">
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