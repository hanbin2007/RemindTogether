/**
 * 1:1 port of `window.HfGroups` from
 * design/project/hf-screens-A.jsx (lines 188-248). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design renders an icon block per card; we render `coverEmoji`
 * (or fallback "📌") since real groups carry an emoji rather than a
 * fixed icon name.
 *
 * Pages: src/app/app/groups/page.tsx fetches data and renders this.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, HF } from "@/components/hf";

export interface HfGroupCard {
  id: string;
  name: string;
  /** Emoji shown inside the rotated tile (falls back to "📌"). */
  coverEmoji?: string | null;
  /** Tinted background of the rotated tile. */
  tint: string;
  /** Member count. */
  count: number;
  /** Today's done count (rendered as "今日 N"). */
  today: number;
  /** Optional friction ribbon ("阿莫 老忘"). */
  ribbon: string | null;
  /** Unread poke count → red chip. */
  poke: number;
}

export interface HfGroupsProps {
  /** "5 个群 · 28 个朋友" — caller composes. */
  meta: string;
  groups: HfGroupCard[];
  /** Slot rendered when the user has no groups. */
  emptyFallback?: ReactNode;
  /** Override the "+ 建群" CTA in the header (popup trigger). */
  newGroupTrigger?: ReactNode;
  /** Override the dashed "邀请伙伴" tile at the bottom (popup trigger). */
  inviteTileTrigger?: ReactNode;
}

export function HfGroups({
  meta,
  groups,
  emptyFallback,
  newGroupTrigger,
  inviteTileTrigger,
}: HfGroupsProps) {
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
          <div className="h-meta">{meta}</div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div className="h-display">群组</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Link
                href="/app/search"
                data-testid="groups-search"
                className="hf-btn ghost"
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <HF.Icon name="search" size={14} />
              </Link>
              {newGroupTrigger ?? (
                <Link
                  href="/app/groups/new"
                  data-testid="groups-new"
                  className="hf-btn primary"
                  style={{
                    padding: "6px 10px",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <HF.Icon name="plus" size={12} /> 建群
                </Link>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 14px 70px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
          data-testid="groups-list"
        >
          {groups.length === 0 && emptyFallback}

          {groups.map((g, i) => (
            <Link
              key={g.id}
              href={`/app/groups/${g.id}`}
              data-testid={`groups-row-${g.id}`}
              className="hf-box"
              style={{
                padding: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  border: "1.5px solid var(--line)",
                  borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px",
                  background: g.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  transform: i % 2 ? "rotate(-2deg)" : "rotate(2deg)",
                }}
              >
                {g.coverEmoji ?? "📌"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div className="h-h3">{g.name}</div>
                  {g.poke > 0 && (
                    <span
                      className="hf-chip poke"
                      style={{ fontSize: 11, padding: "1px 7px" }}
                    >
                      {g.poke}
                    </span>
                  )}
                </div>
                <div
                  className="h-body"
                  style={{
                    fontSize: 13,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {g.count} 人 · 今日 {g.today}
                  {g.ribbon && (
                    <>
                      {" · "}
                      <span
                        data-testid={`groups-row-${g.id}-ribbon`}
                        style={{ color: "var(--poke)" }}
                      >
                        {g.ribbon}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-meta">›</div>
            </Link>
          ))}

          {/* invite tile */}
          {inviteTileTrigger ?? (
            <Link
              href="/app/groups/new"
              data-testid="groups-invite-tile"
              className="hf-box dashed"
              style={{
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--paper-2)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ display: "inline-flex" }}>
                <HF.Icon name="signpost" size={22} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="h-h3">叫人加进来</div>
                <div className="h-body" style={{ fontSize: 13 }}>
                  分享链接 / 二维码 / 通讯录
                </div>
              </div>
              <span className="hf-arrow" />
            </Link>
          )}
        </div>
      </div>
    </Phone>
  );
}
