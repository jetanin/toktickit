-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RelatedSystem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatedSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentRequester" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevelopmentRequester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "relatedSystemId" INTEGER NOT NULL,
    "summary" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "requestedPriority" "Priority" NOT NULL,
    "itPriority" "Priority",
    "currentStatus" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "removedAt" TIMESTAMP(3),
    "removalReason" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RelatedSystem_name_key" ON "RelatedSystem"("name");

-- CreateIndex
CREATE INDEX "RelatedSystem_isActive_idx" ON "RelatedSystem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DevelopmentRequester_email_key" ON "DevelopmentRequester"("email");

-- CreateIndex
CREATE INDEX "DevelopmentRequester_isActive_idx" ON "DevelopmentRequester"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");

-- CreateIndex
CREATE INDEX "Ticket_categoryId_idx" ON "Ticket"("categoryId");

-- CreateIndex
CREATE INDEX "Ticket_currentStatus_idx" ON "Ticket"("currentStatus");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storagePath_key" ON "Attachment"("storagePath");

-- CreateIndex
CREATE INDEX "Attachment_ticketId_idx" ON "Attachment"("ticketId");

-- CreateIndex
CREATE INDEX "Attachment_ticketId_removedAt_idx" ON "Attachment"("ticketId", "removedAt");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "DevelopmentRequester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_relatedSystemId_fkey" FOREIGN KEY ("relatedSystemId") REFERENCES "RelatedSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
