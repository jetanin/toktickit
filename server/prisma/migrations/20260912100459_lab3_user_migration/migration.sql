-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'CRITICAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TicketStatus" ADD VALUE 'OPEN';
ALTER TYPE "TicketStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE 'RESOLVED';
ALTER TYPE "TicketStatus" ADD VALUE 'CLOSED';
ALTER TYPE "TicketStatus" ADD VALUE 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_requesterId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "requesterResolutionPending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolutionSummary" TEXT,
ADD COLUMN     "ticketOwnerId" INTEGER;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicComment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "PublicComment_ticketId_createdAt_idx" ON "PublicComment"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNote_ticketId_createdAt_idx" ON "InternalNote"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_ticketOwnerId_idx" ON "Ticket"("ticketOwnerId");

-- CreateIndex
CREATE INDEX "Ticket_currentStatus_itPriority_idx" ON "Ticket"("currentStatus", "itPriority");

-- Migrate existing DevelopmentRequester rows into User
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "mustChangePassword", "createdAt", "updatedAt")
SELECT
    "id",
    "name",
    "email",
    '$2b$10$/JUXYn89A7GPKkDiCe1auO9RrwKByKrUb1olCw1bnMRS5HiFECVG6',
    'REQUESTER'::"Role",
    "isActive",
    true,
    "createdAt",
    CURRENT_TIMESTAMP
FROM "DevelopmentRequester"
ON CONFLICT ("id") DO NOTHING;

-- Synchronize User id sequence
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX("id"), 1)) FROM "User";

-- Backfill itPriority on existing tickets if null
UPDATE "Ticket" SET "itPriority" = "requestedPriority" WHERE "itPriority" IS NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketOwnerId_fkey" FOREIGN KEY ("ticketOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
