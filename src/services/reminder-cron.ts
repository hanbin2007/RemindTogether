/**
 * Reminder cron — runs from server.ts on a setInterval.
 *
 * Two responsibilities, both keyed off `Reminder.dueAt`:
 *
 *   1. REMINDER_DUE notifications — when an ACTIVE reminder's dueAt has
 *      passed and we haven't notified for that exact dueAt yet, emit a
 *      Notification + realtime push to creator + assignee.
 *
 *   2. RRULE roll-forward — for reminders with a `repeatRule`, advance
 *      `dueAt` to the next occurrence > the just-fired due time so the
 *      same reminder keeps coming around without manual rescheduling.
 *
 * Dedup uses `Reminder.lastDueNotifiedAt` as a cursor: we only emit when
 * `lastDueNotifiedAt < dueAt` (or NULL), and update it to the original
 * `dueAt` after emission. This way the same dueAt can't fire twice even
 * across multiple ticks; and after RRULE roll-forward the cursor lags
 * the new dueAt so the next occurrence will fire normally.
 *
 * Single-process safe (PM2 fork). Concurrent ticks across multiple
 * processes would still be safe-ish because we use compare-and-swap
 * UPDATE WHERE clauses — but production is fork=1 today so we don't
 * bother with advisory locks.
 */
import { prisma } from "@/lib/prisma";
import { RRule } from "rrule";
import { emitNotification } from "@/services/notifications";

export interface ReminderTickResult {
  scanned: number;
  notified: number;
  rolled: number;
}

/**
 * Compute the next RRULE occurrence strictly after `after`. Returns null
 * when the rule is invalid or has no future occurrence.
 *
 * Exported for direct unit testing.
 */
export function nextOccurrence(
  rule: string,
  after: Date,
): Date | null {
  try {
    // RRule.fromString accepts both "RRULE:..." and bare "FREQ=...".
    const r = RRule.fromString(rule);
    const next = r.after(after, false);
    return next ?? null;
  } catch {
    return null;
  }
}

export async function tickReminders(
  now: Date = new Date(),
): Promise<ReminderTickResult> {
  // Active, due-or-past, not already notified for the current dueAt.
  // We pull the minimum fields needed; recipients are derived per-row.
  const due = await prisma.reminder.findMany({
    where: {
      status: "ACTIVE",
      isDeleted: false,
      dueAt: { not: null, lte: now },
      OR: [
        { lastDueNotifiedAt: null },
        // Postgres doesn't let us compare two columns in Prisma's where
        // helper directly, so we filter the "lastDueNotifiedAt < dueAt"
        // case in code below. Pulling these candidates here.
        { lastDueNotifiedAt: { lt: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      groupId: true,
      group: { select: { name: true } },
      creatorId: true,
      assigneeId: true,
      dueAt: true,
      repeatRule: true,
      lastDueNotifiedAt: true,
    },
    orderBy: { dueAt: "asc" },
    take: 200,
  });

  let notified = 0;
  let rolled = 0;
  for (const r of due) {
    if (!r.dueAt) continue;
    // Skip rows that already had this dueAt notified (race-safe filter).
    if (r.lastDueNotifiedAt && r.lastDueNotifiedAt >= r.dueAt) continue;

    // Compare-and-swap: update only when the row still matches our view.
    // Use the dueAt as the swap key so a concurrent tick can't double-fire.
    const updated = await prisma.reminder.updateMany({
      where: {
        id: r.id,
        status: "ACTIVE",
        isDeleted: false,
        dueAt: r.dueAt,
        OR: [
          { lastDueNotifiedAt: null },
          { lastDueNotifiedAt: { lt: r.dueAt } },
        ],
      },
      data: { lastDueNotifiedAt: r.dueAt },
    });
    if (updated.count === 0) continue;

    const recipients = new Set<string>([r.creatorId]);
    if (r.assigneeId) recipients.add(r.assigneeId);

    await Promise.all(
      Array.from(recipients).map((userId) =>
        emitNotification(userId, {
          kind: "REMINDER_DUE",
          reminderId: r.id,
          reminderTitle: r.title,
          groupId: r.groupId,
          groupName: r.group?.name ?? null,
          dueAt: r.dueAt!.toISOString(),
        }),
      ),
    );
    notified += recipients.size;

    // RRULE roll-forward: bump dueAt to the next occurrence strictly after
    // the fired one. We don't touch status — recurring reminders stay
    // ACTIVE and ride the new dueAt until the user disables them.
    if (r.repeatRule) {
      const next = nextOccurrence(r.repeatRule, r.dueAt);
      if (next) {
        await prisma.reminder.updateMany({
          where: { id: r.id, dueAt: r.dueAt },
          data: { dueAt: next },
        });
        rolled += 1;
      }
    }
  }

  return { scanned: due.length, notified, rolled };
}
