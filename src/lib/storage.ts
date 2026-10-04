import { createClient } from "@supabase/supabase-js";

const BUCKET = "documents";

//YEh file sirf server pe use honi chahiye 
function client() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url || !key) throw new Error("Supabase env variables are missing ")
    return createClient(url, key, { auth: { persistSession: false } });    
}


export async function uploadToStorage(path: string,body: Buffer, contentType: string) {
    const { error } = await client() // client database se baat krne kr liey
        .storage.from(BUCKET)
        .upload(path, body, {
            contentType: contentType || "application/octet-stream",
            upsert: false,
        });
    if (error) throw new Error(`Storage upload failed: ${error.message}`)    
}

export async function deleteFromStorage(path: string) {
    await client().storage.from(BUCKET).remove([path]);
}

