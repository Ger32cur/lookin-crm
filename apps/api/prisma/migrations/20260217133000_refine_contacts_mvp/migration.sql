-- AlterTable
ALTER TABLE "Contact"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "status" TEXT;

-- Existing records fallback: map legacy "name" into "firstName"
UPDATE "Contact"
SET "firstName" = "name"
WHERE "firstName" IS NULL;

-- AlterTable
ALTER TABLE "Contact"
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact"
DROP COLUMN "name",
DROP COLUMN "notes";

-- CreateIndex
CREATE UNIQUE INDEX "Contact_organizationId_email_key" ON "Contact"("organizationId", "email");
