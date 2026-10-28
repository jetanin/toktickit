-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(1000) NOT NULL,
    "result" VARCHAR(1000) NOT NULL,
    "performedById" INTEGER NOT NULL,
    "assigneeId" INTEGER,
    "status" "ActionStatus" NOT NULL DEFAULT 'COMPLETED',
    "isFollowUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" VARCHAR(1000),
    "attachmentNotes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionTaken_ticketId_actionDateTime_idx" ON "ActionTaken"("ticketId", "actionDateTime");

-- CreateIndex
CREATE INDEX "ActionTaken_assigneeId_status_idx" ON "ActionTaken"("assigneeId", "status");

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
