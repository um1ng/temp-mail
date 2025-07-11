-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "category" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "verification_code" TEXT;
