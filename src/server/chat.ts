import { prisma } from "@/lib/db";
import type { Prisma } from "../../generated/prisma/client";


export type StoredSource = {
    id: string;
    documentId: string;
    filename: string;
    pageNumber: number;
    snippet: string;
}

export function saveChatMessage(args: {
  userId: string;
  workspaceId: string;
  question: string;
  answer: string;
  sources: StoredSource[];
}) {
  return prisma.chatMessage.create({
    data: {
      userId: args.userId,
      workspaceId: args.workspaceId,
      question: args.question,
      answer: args.answer,
      sources: args.sources as unknown as Prisma.InputJsonValue,
    },
  });
}

//User sirf apni hi chat dhekh skta h kisi aur ki chat nhi 
export async function getChatHistory(userId: string, workspaceId: string, limit =  50) {
    const rows = await prisma.chatMessage.findMany({
        where: { userId, workspaceId },
        orderBy: { createdAt: "desc" },
        take: limit,
    })
    return rows.reverse(); //Older chats sbse upar rahega so that ki chat top to bottom rahegi
}