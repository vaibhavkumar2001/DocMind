"use server"

//Yeh form ka backend h 
import { revalidatePath } from "next/cache";
//revalidatePath("/some-path") Next.js ko bolta hai: "Is path ka cache purana ho gaya hai, agli request pe isse fresh data ke saath dobara bana do."
import { getOrCreateUser } from "@/server/user";
import { createWorkspace } from "@/server/workspaces";


export async function createWorkspaceAction(formData: FormData) {
    const user = await getOrCreateUser();
    if(!user) throw new Error("Not Signed In");

    const name = String(formData.get("name") ?? "").trim();
    if(name.length < 2 || name.length > 50) return;

    await createWorkspace(user.id, name);
    revalidatePath("/documents");
}