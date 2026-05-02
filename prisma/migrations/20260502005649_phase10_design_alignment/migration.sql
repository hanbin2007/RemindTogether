-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ReminderPriority" AS ENUM ('NORMAL', 'HIGH');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "cadence" TEXT,
ADD COLUMN     "iconName" TEXT,
ADD COLUMN     "tintColor" TEXT,
ADD COLUMN     "visibility" "GroupVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "Poke" ADD COLUMN     "replyToId" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "priority" "ReminderPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "proofRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dndEnd" TEXT,
ADD COLUMN     "dndStart" TEXT,
ADD COLUMN     "notificationSound" TEXT NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "reminderId" TEXT,
    "completionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_ownerId_idx" ON "Attachment"("ownerId");

-- CreateIndex
CREATE INDEX "Attachment_reminderId_idx" ON "Attachment"("reminderId");

-- CreateIndex
CREATE INDEX "Attachment_completionId_idx" ON "Attachment"("completionId");

-- CreateIndex
CREATE INDEX "Group_visibility_idx" ON "Group"("visibility");

-- CreateIndex
CREATE INDEX "Poke_replyToId_idx" ON "Poke"("replyToId");

-- CreateIndex
CREATE INDEX "Reminder_assigneeId_idx" ON "Reminder"("assigneeId");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poke" ADD CONSTRAINT "Poke_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Poke"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "Completion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
