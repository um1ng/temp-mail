-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "encrypted_content" TEXT,
ADD COLUMN     "encrypted_subject" TEXT,
ADD COLUMN     "encryption_algorithm" TEXT,
ADD COLUMN     "encryption_key_id" TEXT,
ADD COLUMN     "extension_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "forward_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "from_domain" TEXT,
ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "size" INTEGER;

-- CreateTable
CREATE TABLE "email_shares" (
    "id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "share_token" TEXT NOT NULL,
    "password" TEXT,
    "expires_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "max_views" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMP(3),

    CONSTRAINT "email_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_encryptions" (
    "id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "key_id" TEXT,
    "encrypted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_encryptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_decryptions" (
    "id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "decrypted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "email_decryptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_forwards" (
    "id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "content" TEXT,
    "html_content" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message_id" TEXT,
    "include_attachments" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "expire_after" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_forwards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_shares_share_token_key" ON "email_shares"("share_token");

-- AddForeignKey
ALTER TABLE "email_shares" ADD CONSTRAINT "email_shares_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_encryptions" ADD CONSTRAINT "email_encryptions_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_decryptions" ADD CONSTRAINT "email_decryptions_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_forwards" ADD CONSTRAINT "email_forwards_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
