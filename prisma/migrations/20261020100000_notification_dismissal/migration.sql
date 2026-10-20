-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "isDismissed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "dismissedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_isDismissed_createdAt_idx" ON "Notification"("userId", "isDismissed", "createdAt");
