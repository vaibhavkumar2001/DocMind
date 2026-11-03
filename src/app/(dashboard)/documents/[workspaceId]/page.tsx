import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateUser } from "@/server/user";
import { getWorkspaceForUser } from "@/server/workspaces";
import { getWorkspaceDocuments } from "@/server/documents";
import { formatSize } from "@/lib/utils";
import WorkspaceHeader from "@/components/dashboard/WorkspaceHeader";
import UploadBox from "@/components/dashboard/UploadBox";
import TranscriptForm from "@/components/dashboard/TranscriptForm";
import DeleteButton from "@/components/dashboard/DeleteButton";
import { deleteDocumentAction } from "./action";

const STATUS: Record<string, { label: string; className: string; pulse?: boolean }> = {
  PROCESSING: { label: "Processing", className: "bg-warning/15 text-warning", pulse: true },
  READY: { label: "Ready", className: "bg-success/15 text-success" },
  FAILED: { label: "Failed", className: "bg-destructive/15 text-destructive" },
};

const FILE_ICON = "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5";
const VIDEO_ICON =
  "M15 10l5-3v10l-5-3M4 6h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z";

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
    <main className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
      <WorkspaceHeader
        workspaceId={workspace.id}
        name={workspace.name}
        role={role}
        active="documents"
      />

      {/* Upload files */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upload files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add documents to this workspace. They are indexed automatically and become searchable in chat.
        </p>
        <div className="mt-4">
          <UploadBox workspaceId={workspace.id} />
        </div>
      </section>

      {/* Video transcript */}
      <TranscriptForm workspaceId={workspace.id} />

      {/* Document list */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Documents</h2>
          <span className="rounded-full border bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {documents.length}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={FILE_ICON} />
              </svg>
            </span>
            <p className="mt-4 font-medium">No documents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a PDF, DOCX or TXT file, or add a video transcript to get started.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {documents.map((d) => {
              const status = STATUS[d.status] ?? STATUS.PROCESSING;
              const isVideo = d.sourceType === "VIDEO";
              return (
                <li
                  key={d.id}
                  className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:border-primary/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={isVideo ? VIDEO_ICON : FILE_ICON} />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.filename}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isVideo ? "Video transcript" : formatSize(d.sizeBytes)} ·{" "}
                        {new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      {d.errorMessage && (
                        <p className="mt-1 text-xs text-destructive">{d.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full bg-current ${status.pulse ? "animate-pulse" : ""}`}
                      />
                      {status.label}
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
              );
            })}
          </ul>
        )}
      </section>

      {/* Developer test pages (kept small and out of the way) */}
      <div className="mt-12 flex gap-4 border-t pt-4 text-xs text-muted-foreground">
        <span>Dev tools:</span>
        <Link href={`/documents/${workspace.id}/search`} className="hover:text-foreground">
          Search test
        </Link>
        <Link href={`/documents/${workspace.id}/ask`} className="hover:text-foreground">
          Ask test
        </Link>
      </div>
    </main>
  );
}