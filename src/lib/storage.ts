import { createClient } from "@supabase/supabase-js";

const BUCKET = "documents";

// This file must only be used on the server (it uses the secret key)
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env variables are missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadToStorage(path: string, body: Buffer, contentType: string) {
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, body, {
      contentType: contentType || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

// Used by the background worker to read an uploaded file again
export async function downloadFromStorage(path: string): Promise<Buffer> {
  const { data, error } = await client().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteFromStorage(path: string) {
  await client().storage.from(BUCKET).remove([path]);
}

export async function createSignedUrl(path: string, seconds = 60) {
  const { data, error } = await client().storage.from(BUCKET).createSignedUrl(path, seconds);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}