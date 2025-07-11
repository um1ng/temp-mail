-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_starred" BOOLEAN NOT NULL DEFAULT false;
