import { prisma } from "@/lib/db";


//Sirf wahi workspace jisme ye User member h
export function getUserWorkspaces(userId: string) {
    return prisma.workspace.findMany({
        where: { members: { some: {userId }}},
        //Yhi line woh multi-tenancy  h interview ke liye important h
        //iss wali line hai. Isse har user ko sirf apni teams dikhengi, kisi aur ki nahi
        orderBy: { createdAt: "desc" },
        include: { members: { where: { userId },select: { role: true  } } },
    })
}

//Workspace banaoo aur banane wale ko admin banado
export function createWorkspace(userId: string, name: string) {
    return prisma.workspace.create({
        data: {
            name,
            members: { create: { userId, role: "ADMIN"  } },
        },
    });
}

