/**
 * 1:1 port of `window.HfL2Tags` from
 * design/project/hf-screens-L2.jsx (lines 909-969). The JSX below is a
 * literal copy with the standard mechanical replacements:
 *
 *   - <Phone> wrapper                   → <Phone>
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded sample tag list         → typed `tags` prop
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design only renders read-only tag rows; we add a thin "create new
 * tag" form slot above and a "×" delete button per row so the
 * existing /app/me/tags page can keep its server-action wiring without
 * losing its testids (`tag-${id}`, `tag-${id}-delete`, `tags-list`,
 * `tags-empty`).
 */
import { Phone, HF } from "@/components/hf";
import type { ReactNode } from "react";
import type { IconName } from "@/components/sketch/icon";

export interface HfL2TagsItem {
  id: string;
  /** "#早餐打卡" — caller composes the leading `#`. */
  name: string;
  /** Icon glyph (key in `IconName`). */
  iconName: IconName | string;
  /** Tag color (hex or `var(--…)`). Used for the rotated swatch chip. */
  color: string;
  /** Usage count — "本周 N 次" or "没用过" when 0. */
  usageCount: number;
}

export interface HfL2TagsProps {
  tags: HfL2TagsItem[];
  /** Slot rendered ABOVE the list — typically the create-tag form. */
  createSlot?: ReactNode;
  /** Slot rendered as the per-row trailing affordance — typically a
   *  "×" delete button form. Receives the current tag so the caller can
   *  build a hidden id input. */
  deleteSlot?: (tag: HfL2TagsItem) => ReactNode;
}

/** Best-effort projection: tag color → tinted background (matches
 *  design's ok-soft / claim-soft / poke-soft / paper-2 palette). The
 *  caller's color string is the border accent; the soft fill below is
 *  derived heuristically based on hex hue (greens → ok-soft, blues →
 *  claim-soft, reds/oranges → poke-soft, neutral → paper-2). */
function bgFor(color: string): string {
  const c = color.toLowerCase();
  if (c.startsWith("var(")) return "var(--paper-2)";
  if (!/^#[0-9a-f]{6}$/.test(c)) return "var(--paper-2)";
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  if (g > r && g > b) return "var(--ok-soft)";
  if (b > r && b > g) return "var(--claim-soft)";
  if (r > g && r > b) return "var(--poke-soft)";
  return "var(--paper-2)";
}

export function HfL2Tags({ tags, createSlot, deleteSlot }: HfL2TagsProps) {
  const usedThisWeek = tags.filter((t) => t.usageCount > 0).length;
  return (
    <Phone>
      <div
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1.5px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}>‹</span>
          <div style={{ flex: 1 }}>
            <div className="h-meta">分类</div>
            <div className="h-row" style={{ fontSize: 16 }}>
              我的标签
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "12px 14px",
            overflowY: "auto",
            height: "calc(100% - 56px)",
          }}
        >
          {createSlot && <div style={{ marginBottom: 12 }}>{createSlot}</div>}

          <div className="h-meta">本周用过 · {usedThisWeek}</div>

          {tags.length === 0 ? (
            <div
              data-testid="tags-empty"
              className="hf-box dashed"
              style={{
                marginTop: 6,
                padding: 16,
                textAlign: "center",
                fontFamily: "var(--hand-2)",
                fontSize: 14,
                color: "var(--ink-mute)",
              }}
            >
              还没有标签 — 上面建一个。
            </div>
          ) : (
            <div
              className="hf-box"
              style={{ marginTop: 6, padding: "6px 10px" }}
              data-testid="tags-list"
            >
              {tags.map((t, i, a) => {
                const dim = t.usageCount === 0;
                return (
                  <div
                    key={t.id}
                    data-testid={`tag-${t.id}`}
                    className="hf-row"
                    style={{
                      padding: "7px 0",
                      borderBottom:
                        i === a.length - 1
                          ? "none"
                          : "1.3px dashed var(--ink-faint)",
                      opacity: dim ? 0.55 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1.5px solid var(--line)",
                        background: bgFor(t.color),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <HF.Icon name={t.iconName as IconName} size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="h-row"
                        style={{ fontSize: 14, color: t.color }}
                      >
                        {t.name}
                      </div>
                      <div className="h-meta">
                        {t.usageCount > 0
                          ? `本周 ${t.usageCount} 次`
                          : "没用过"}
                      </div>
                    </div>
                    {deleteSlot ? (
                      deleteSlot(t)
                    ) : (
                      <HF.Icon
                        name="dots"
                        size={14}
                        color="var(--ink-faint)"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="h-meta"
            style={{
              marginTop: 14,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            标签是给自己看的 — 朋友看不到细节
          </div>
        </div>
      </div>
    </Phone>
  );
}
