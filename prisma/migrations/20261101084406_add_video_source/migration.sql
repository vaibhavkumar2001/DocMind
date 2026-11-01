-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('FILE', 'VIDEO');

-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN     "startSeconds" INTEGER;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "sourceType" "DocumentSource" NOT NULL DEFAULT 'FILE',
ADD COLUMN     "sourceUrl" TEXT,
ALTER COLUMN "storagePath" DROP NOT NULL;
