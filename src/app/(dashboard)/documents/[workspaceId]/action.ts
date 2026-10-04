"use server";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/server/user";
import { deleteDocument } from "@/server/documents";


export async function deleteDocumentAction(formData: FormData) {
    const user = await getOrCreateUser();

    if(!user) throw new Error("Not Signed In");

    const documentId = String(formData.get("documentId") ?? "");
    const workspaceId = String(formData.get("workspaceId") ?? "");

    if(!documentId) return;

    await deleteDocument(user.id, documentId);
    revalidatePath(`/documents/${workspaceId}`);
}