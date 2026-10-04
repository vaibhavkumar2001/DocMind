CREATE EXTENSION IF NOT EXISTS vector;
-- //Pehli line vector ko chaloo krti h


-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN     "embedding" vector(768);
