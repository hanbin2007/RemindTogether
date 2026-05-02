import Link from "next/link";

const TABS = [
  { key: "list", label: "清单" },
  { key: "leaderboard", label: "加油榜" },
  { key: "history", label: "历史" },
  { key: "settings", label: "设置" },
] as const;

export function GroupTabs({
  groupId,
  active,
}: {
  groupId: string;
  active: "list" | "leaderboard" | "history" | "settings";
}) {
  return (
    <div
      data-testid="group-tabs"
      className="flex gap-4 border-b border-dashed border-rt-ink-faint mt-3"
      style={{ borderColor: "var(--rt-ink-faint)" }}
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={
              t.key === "list"
                ? `/app/groups/${groupId}`
                : `/app/groups/${groupId}?tab=${t.key}`
            }
            data-testid={`group-tab-${t.key}`}
            data-active={isActive ? "true" : undefined}
            className="rt-h-row pb-1.5"
            style={{
              fontSize: 15,
              color: isActive ? "var(--rt-ink)" : "var(--rt-ink-mute)",
              borderBottom: `2.4px solid ${isActive ? "var(--rt-ink)" : "transparent"}`,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
