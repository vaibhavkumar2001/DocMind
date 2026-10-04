import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { getWorkspaceDocuments } from "@/server/documents";
import { formatSize } from "@/lib/utils";
import UploadBox from "@/components/dashboard/UploadBox";
import DeleteButton from "@/components/dashboard/DeleteButton";
import { deleteDocumentAction } from "./action"

const statusStyle: Record<string, string> = {
  PROCESSING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  READY: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const user = await getOrCreateUser();
  if (!user) notFound();

  const workspace = await getWorkspaceForUser(user.id, workspaceId);
  if (!workspace) notFound();

  const role = workspace.members[0]?.role;
  const isAdmin = role === "ADMIN";
  const documents = await getWorkspaceDocuments(workspace.id);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <Link href="/documents" className="text-sm text-indigo-600 hover:underline">
          &larr; All workspaces
        </Link>
        <UserButton />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
          {role}
        </span>
      </div>

      <div className="mt-8">
        <UploadBox workspaceId={workspace.id} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Documents ({documents.length})</h2>
      <ul className="mt-3 space-y-2">
        {documents.length === 0 && (
          <li className="text-sm text-slate-500">There are no documents yet.</li>
        )}
        {documents.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {d.filename}{" "}
                <span className="font-normal text-slate-500">({formatSize(d.sizeBytes)})</span>
              </p>
              {d.errorMessage && <p className="mt-0.5 text-xs text-red-600">{d.errorMessage}</p>}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[d.status] ?? ""}`}
              >
                {d.status}
              </span>
              {isAdmin && (
                <DeleteButton
                  action={deleteDocumentAction}
                  documentId={d.id}
                  workspaceId={workspace.id}
                  filename={d.filename}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}