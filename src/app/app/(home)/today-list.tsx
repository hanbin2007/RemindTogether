import { ReminderRow } from "./reminder-row";

export interface ListReminder {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "DONE" | "SKIPPED";
  visibility: "PRIVATE" | "GROUP";
  group: { id: string; name: string } | null;
  dueAt?: string | null;
}

/**
 * Renders a flat list of reminders. `compact=true` switches to the
 * design's `hf-row` pattern (single line + dashed divider) used inside
 * `早上 / 晚上` group cards on Today. Default (compact=false) renders
 * each row as its own card — used on /app/private and group detail.
 */
export function TodayList({
  reminders,
  emptyHint,
  compact = false,
}: {
  reminders: ListReminder[];
  emptyHint: string;
  compact?: boolean;
}) {
  if (reminders.length === 0) {
    if (!emptyHint) return null;
    return (
      <p
        data-testid="today-empty"
        className="rt-h-body text-rt-ink-mute py-6"
      >
        {emptyHint}
      </p>
    );
  }
  if (compact) {
    return (
      <ul data-testid="today-list">
        {reminders.map((r, i) => (
          <ReminderRow
            key={r.id}
            id={r.id}
            title={r.title}
            description={r.description}
            status={r.status}
            visibility={r.visibility}
            groupName={r.group?.name}
            dueAt={r.dueAt ?? null}
            compact
            last={i === reminders.length - 1}
          />
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-2" data-testid="today-list">
      {reminders.map((r, i) => (
        <ReminderRow
          key={r.id}
          id={r.id}
          title={r.title}
          description={r.description}
          status={r.status}
          visibility={r.visibility}
          groupName={r.group?.name}
          dueAt={r.dueAt ?? null}
          staggerMs={Math.min(i * 40, 240)}
        />
      ))}
    </ul>
  );
}
