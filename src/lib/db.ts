//iss pure ka mtlb h ki 
//Ek line mein: Ye file tumhare project ka database connection manager hai — PostgreSQL se Prisma ko connect karta hai aur development mein duplicate database connections banne se bachata hai.



//Yeh database se baat krne ke liye use hota h 
//PrismaClient ke through tum database ke tables ko access karoge, jaise: await prisma.user.findMany();




import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
//PrismaPG Matlab Prisma aur PostgreSQL database ke beech connection establish karne mein help karta hai.

//PrismaClient ek type-safe query h jisse ki hm database application se baat krta h
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
//globalThis ek global object hota hai jo application ke different files/reloads ke beech accessible reh sakta hai.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if(process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;