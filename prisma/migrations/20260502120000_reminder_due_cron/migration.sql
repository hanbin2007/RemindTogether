-- Reminder cron: dedup column for REMINDER_DUE notifications and the
-- RRULE rolling cursor.
ALTER TABLE "Reminder" ADD COLUMN "lastDueNotifiedAt" TIMESTAMP(3);

-- Speed up the tick scan: ACTIVE reminders with dueAt at-or-before now,
-- still un-notified for the current dueAt.
CREATE INDEX "Reminder_status_dueAt_lastDueNotifiedAt_idx"
  ON "Reminder" ("status", "dueAt", "lastDueNotifiedAt");

-- Backfill: mark all existing reminders as already-notified for their
-- current dueAt. Without this, the first cron tick after deploy would
-- mass-fire REMINDER_DUE for every overdue legacy row.
UPDATE "Reminder"
   SET "lastDueNotifiedAt" = "dueAt"
 WHERE "dueAt" IS NOT NULL;
