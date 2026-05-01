import { ReminderRow } from "./reminder-row";

interface ListReminder {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "DONE" | "SKIPPED";
  visibility: "PRIVATE" | "GROUP";
  group: { id: string; name: string } | null;
}

export function TodayList({
  reminders,
  emptyHint,
}: {
  reminders: ListReminder[];
  emptyHint: string;
}) {
  if (reminders.length === 0) {
    return (
      <p
        data-testid="today-empty"
        className="font-[family-name:var(--font-kalam)] text-rt-ink-mute py-6"
      >
        {emptyHint}
      </p>
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
          staggerMs={Math.min(i * 40, 240)}
        />
      ))}
    </ul>
  );
}
