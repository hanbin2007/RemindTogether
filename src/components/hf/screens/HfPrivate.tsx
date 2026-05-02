/**
 * 1:1 port of `window.HfPrivate` from
 * design/project/hf-screens-A.jsx (lines 126-185). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte.
 *
 * Pages: src/app/app/private/page.tsx fetches data and renders this.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, HF, RemRow } from "@/components/hf";

export interface HfPrivateItem {
  id: string;
  title: string;
  /** Composed by caller (e.g. "牙科 · 本周内"). */
  sub?: string;
  done?: boolean;
  /** Optional right-side time hint (e.g. "3 天"). */
  time?: string;
  /** Whether this is the last row in its bucket (toggles divider). */
  last?: boolean;
}

export interface HfPrivateGroup {
  /** Stable key — usually the tag id, or `_none_` for the 未分类 bucket. */
  key: string;
  name: string;
  /** Tag color or null. Renders the small rotated swatch. */
  color?: string | null;
  count: number;
  items: HfPrivateItem[];
}

export interface HfPrivateProps {
  /** "只有你能看见" — wrapped with the lock icon by the design. */
  meta?: string;
  /** Active filter key — "all" | "today" | "week" | "none". */
  activeFilter: "all" | "today" | "week" | "none";
  /** Renders the dashed hint card at the bottom. */
  hintCard?: boolean;
  /** Tag-bucketed groups. */
  groups: HfPrivateGroup[];
  /** Click on the check toggles complete. */
  onComplete?: (id: string) => void;
  /** Long-press / right-click on a row. */
  onContextMenu?: (id: string) => void;
  /** Slot rendered between the segmented chips and the list groups
   *  (typically QuickAdd). */
  topSlot?: ReactNode;
  /** Slot rendered when there is nothing in any bucket. */
  emptyFallback?: ReactNode;
  /** Override the "+ 加" CTA in the header. Lets the page swap the
   *  default deep-link Link for a popup trigger. */
  newReminderTrigger?: ReactNode;
}

const FILTERS: { key: HfPrivateProps["activeFilter"]; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天" },
  { key: "week", label: "本周" },
  { key: "none", label: "没期限" },
];

function filterHref(key: HfPrivateProps["activeFilter"]): string {
  return key === "all" ? "/app/private" : `/app/private?filter=${key}`;
}

export function HfPrivate({
  meta = "只有你能看见",
  activeFilter,
  hintCard = true,
  groups,
  onComplete,
  onContextMenu,
  topSlot,
  emptyFallback,
  newReminderTrigger,
}: HfPrivateProps) {
  const hasContent = groups.some((g) => g.items.length > 0);
  return (
    <Phone>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
        }}
      >
        <div style={{ padding: "14px 18px 4px" }}>
          <div
            className="h-meta"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <HF.Icon name="lock" size={12} /> {meta}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div className="h-display">私人</div>
            {newReminderTrigger ?? (
              <Link
                href="/app/reminders/new"
                data-testid="private-new"
                className="hf-btn primary"
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <HF.Icon name="plus" size={12} /> 加
              </Link>
            )}
          </div>
        </div>

        {/* segmented */}
        <div
          style={{ display: "flex", gap: 4, padding: "8px 14px 0" }}
          data-testid="private-filters"
        >
          {FILTERS.map((f) => {
            const active = f.key === activeFilter;
            return (
              <Link
                key={f.key}
                href={filterHref(f.key)}
                data-testid={`private-filter-${f.key}`}
                data-active={active ? "true" : undefined}
                className={`hf-chip ${active ? "fill" : ""}`}
                style={{ flex: 1, justifyContent: "center", fontSize: 13 }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 70px" }}>
          {topSlot && <div style={{ marginTop: 6 }}>{topSlot}</div>}

          {!hasContent && emptyFallback}

          {groups.map((g, idx) => (
            <div key={g.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: idx === 0 ? 6 : 16,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    background: g.color ?? "var(--ink)",
                    borderRadius: 3,
                    transform: `rotate(${idx % 2 === 0 ? 8 : -6}deg)`,
                  }}
                />
                <div className="h-h2">{g.name}</div>
                <div className="h-meta" style={{ marginLeft: "auto" }}>
                  {g.count} 件
                </div>
              </div>
              <div
                className="hf-box"
                style={{ padding: "4px 14px", marginTop: 6 }}
              >
                {g.items.map((r, i) => (
                  <RemRow
                    key={r.id}
                    href={`/app/reminders/${r.id}`}
                    title={r.title}
                    sub={r.sub}
                    done={r.done}
                    time={r.time}
                    last={i === g.items.length - 1}
                    onComplete={
                      onComplete ? () => onComplete(r.id) : undefined
                    }
                    onContextMenu={
                      onContextMenu
                        ? (e) => {
                            e.preventDefault();
                            onContextMenu(r.id);
                          }
                        : undefined
                    }
                    testid={`reminder-row-${r.id}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* hint card */}
          {hintCard && hasContent && (
            <div
              className="hf-box dashed dim tilt-r"
              data-testid="private-hint"
              style={{
                marginTop: 18,
                padding: 12,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{ display: "inline-flex", color: "var(--claim)" }}
              >
                <HF.Icon name="handshake" size={22} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="h-row">
                  这件事可以 <span className="hf-hl">让别人帮你记</span>
                </div>
                <div className="h-body">长按一项 → 分享到群组 / @ 朋友</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Phone>
  );
}
