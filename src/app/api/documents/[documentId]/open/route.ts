import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/server/user";
import { getDocumentForUser } from "@/server/documents";
import { createSignedUrl } from "@/lib/storage";

export const runtime = "nodejs";

// Adds ?t=<seconds>s so a video opens at the right moment
function withTime(url: string, seconds: number) {
  const u = new URL(url);
  if (Number.isInteger(seconds) && seconds > 0) u.searchParams.set("t", `${seconds}s`);
  return u.toString();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { documentId } = await params;

  // Membership check: if the user is not a member, the document "does not exist"
  const doc = await getDocumentForUser(user.id, documentId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const search = new URL(req.url).searchParams;

  // Video documents have no stored file: send the user to the original link
  if (!doc.storagePath) {
    if (!doc.sourceUrl || !/^https?:\/\//i.test(doc.sourceUrl)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.redirect(withTime(doc.sourceUrl, Number(search.get("t"))));
  }

  try {
    const url = await createSignedUrl(doc.storagePath, 60);
    const page = Number(search.get("page"));
    const isPdf = doc.filename.toLowerCase().endsWith(".pdf");
    const target = isPdf && Number.isInteger(page) && page > 0 ? `${url}#page=${page}` : url;
    return NextResponse.redirect(target);
  } catch (e) {
    console.error("[open] failed", e);
    return NextResponse.json({ error: "Could not open the file" }, { status: 500 });
  }
}