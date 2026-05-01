import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";

interface Entry {
  userId: string;
  displayName: string;
  doneCount: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * 加油榜 — positive ranking. Top 3 get medals; below that everyone is
 * shown by name without an explicit rank number. doneCount=0 becomes a
 * "想搭把手" CTA instead of a zero (no shame ladder).
 *
 * `compact` shows just the top 3 inside a dim box (used inside the
 * group's main list tab); the default fully-rendered list is shown on
 * the dedicated 加油榜 tab.
 */
export function Leaderboard({
  entries,
  compact = false,
  weekTotal,
}: {
  entries: Entry[];
  compact?: boolean;
  weekTotal?: number;
}) {
  if (entries.length === 0) return null;

  if (compact) {
    return (
      <div
        data-testid="leaderboard"
        className="rt-box rt-box-dim p-3 mt-4"
      >
        <div className="flex items-center mb-2">
          <span className="inline-flex rt-text-ok">
            <Icon name="confetti" size={14} />
          </span>
          <h3 className="rt-h-h3 ml-1.5">本周加油榜</h3>
          <span className="rt-h-meta ml-auto">看全榜 ›</span>
        </div>
        {entries.map((e, i) => (
          <div
            key={e.userId}
            data-testid={`leaderboard-row-${e.userId}`}
            data-rank={i + 1}
            className="flex items-center gap-2.5 mt-2.5"
          >
            <span
              className="rt-h-h3 text-center"
              style={{
                width: 18,
                color: i === 0 ? "var(--rt-ok)" : "var(--rt-ink-mute)",
              }}
            >
              {i < 3 ? MEDALS[i] : i + 1}
            </span>
            <Avatar name={e.displayName} i={avatarSlot(e.userId)} size={28} />
            <div className="flex-1 min-w-0">
              <p className="rt-h-row" style={{ fontSize: 15 }}>
                {e.displayName}
              </p>
              <p className="rt-h-meta">
                {weekTotal
                  ? `${e.doneCount}/${weekTotal} 件已收下`
                  : `${e.doneCount} 件已收下`}
              </p>
            </div>
            {e.doneCount === 0 ? (
              <button
                type="button"
                data-testid={`leaderboard-row-${e.userId}-cheer`}
                className="rt-btn rt-btn-ghost"
                style={{
                  padding: "4px 10px",
                  fontSize: 13,
                  borderColor: "var(--rt-claim)",
                  color: "var(--rt-claim)",
                  borderWidth: 1.4,
                  borderStyle: "solid",
                }}
              >
                <Icon name="handshake" size={12} /> 想搭把手
              </button>
            ) : (
              <span
                className="rt-h-num"
                style={{ color: "var(--rt-ok)" }}
              >
                {weekTotal
                  ? `${Math.round((e.doneCount / weekTotal) * 100)}%`
                  : `${e.doneCount}`}
              </span>
            )}
          </div>
        ))}
        <p
          className="rt-h-meta italic mt-2.5 pt-2 border-t border-dashed"
          style={{ borderColor: "var(--rt-ink-faint)" }}
        >
          ※ 没有「赖账榜」，谁都有忘的时候
        </p>
      </div>
    );
  }

  return (
    <div data-testid="leaderboard" className="rt-fade-up">
      <p className="rt-h-meta">WEEKLY · 加油榜</p>
      <ul className="mt-2 space-y-2">
        {entries.map((e, i) => (
          <li
            key={e.userId}
            data-testid={`leaderboard-row-${e.userId}`}
            data-rank={i + 1}
            className="rt-rise rt-box-tight rt-bg-paper-2 px-3 py-2.5 flex items-center gap-2.5"
            style={{
              borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px",
              ["--rt-rise-delay" as never]: `${Math.min(i * 40, 240)}ms`,
            }}
          >
            <span
              className="rt-h-h3 text-center"
              style={{
                width: 18,
                color: i === 0 ? "var(--rt-ok)" : "var(--rt-ink-mute)",
              }}
            >
              {i < 3 ? MEDALS[i] : i + 1}
            </span>
            <Avatar name={e.displayName} i={avatarSlot(e.userId)} size={28} />
            <div className="flex-1 min-w-0">
              <p className="rt-h-row truncate">{e.displayName}</p>
            </div>
            {e.doneCount > 0 ? (
              <span className="rt-h-num">{e.doneCount} 件</span>
            ) : (
              <span className="rt-h-meta italic">想搭把手 →</span>
            )}
          </li>
        ))}
      </ul>
      <p
        className="rt-h-meta italic mt-3 pt-2 border-t border-dashed"
        style={{ borderColor: "var(--rt-ink-faint)" }}
      >
        ※ 没有「赖账榜」，谁都有忘的时候
      </p>
    </div>
  );
}
