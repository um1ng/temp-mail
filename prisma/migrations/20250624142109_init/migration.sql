-- CreateTable
CREATE TABLE "email_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email_address_id" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "subject" TEXT,
    "text_content" TEXT,
    "html_content" TEXT,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "has_attachments" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "emails_email_address_id_fkey" FOREIGN KEY ("email_address_id") REFERENCES "email_addresses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content_type" TEXT,
    "size" INTEGER,
    "file_path" TEXT,
    CONSTRAINT "attachments_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "email_addresses_address_key" ON "email_addresses"("address");
