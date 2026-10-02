import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../lib/db";

//Yahan pe Database se baat karenge
//Logged-In user ko apne database mein dhundoo aur agr naa mile toh banado

export async function getOrCreateUser() {
    const clerkUser = await currentUser();
    if(!clerkUser) return null;

    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    return prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: {},
        create: { clerkId: clerkUser.id, email, name },
    })
}