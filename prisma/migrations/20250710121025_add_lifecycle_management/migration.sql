-- AlterTable
ALTER TABLE "email_addresses" ADD COLUMN     "auto_renewal_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "custom_expiration_minutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "last_renewal_at" TIMESTAMP(3),
ADD COLUMN     "max_renewals" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "renewal_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warnings_sent" INTEGER NOT NULL DEFAULT 0;
