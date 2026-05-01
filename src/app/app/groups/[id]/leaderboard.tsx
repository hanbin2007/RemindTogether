interface Entry {
  userId: string;
  displayName: string;
  doneCount: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * 加油榜 — positive ranking. Top 3 get medals; behind that we list
 * everyone else without an explicit number so it doesn't feel like a
 * shame ladder. Empty doneCount becomes a soft "想搭把手" line.
 */
export function Leaderboard({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;
  return (
    <div data-testid="leaderboard" className="rt-fade-up">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
        WEEKLY · 加油榜
      </p>
      <ul className="mt-2 space-y-1">
        {entries.map((e, i) => (
          <li
            key={e.userId}
            data-testid={`leaderboard-row-${e.userId}`}
            data-rank={i + 1}
            className={`rt-rise rt-box-tight bg-rt-paper-2 px-3 py-2 flex items-baseline gap-2`}
            style={{
              borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px",
              ["--rt-rise-delay" as never]: `${Math.min(i * 40, 240)}ms`,
            }}
          >
            <span className="text-lg leading-none">
              {i < 3 ? MEDALS[i] : "·"}
            </span>
            <span className="font-[family-name:var(--font-caveat)] font-semibold text-lg">
              {e.displayName}
            </span>
            {e.doneCount > 0 ? (
              <span className="ml-auto font-mono text-[12px] text-rt-ink-soft">
                {e.doneCount} 件
              </span>
            ) : (
              <span className="ml-auto font-[family-name:var(--font-kalam)] text-[12px] text-rt-ink-mute italic">
                想搭把手 →
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
