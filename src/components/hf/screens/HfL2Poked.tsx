/**
 * 1:1 port of `window.HfL2Poked` from
 * design/project/hf-screens-L2.jsx (lines 318-394). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design hard-codes a single sample poke; this component renders any
 * Poke (with optional Reminder context).
 *
 * Pages: src/app/app/poke/[id]/page.tsx fetches the poke + reminder and
 * renders this.
 */
import Link from "next/link";
import { Phone, HF } from "@/components/hf";

export interface HfL2PokedReminder {
  id: string;
  title: string;
  /** "21:00" — caller composes (or null if none). */
  originalTime: string | null;
}

export interface HfL2PokedProps {
  poke: {
    id: string;
    fromName: string;
    /** avatarSlot(fromUserId) — caller computes. */
    fromSlot: number;
    /** "差一点点" / "想到你了" / "不急慢慢来" — caller derives from tone. */
    tone: string;
    message: string | null;
    /** "下午 2:23" — caller formats per user TZ. */
    sentLabel: string;
    /** "14:23" — caller formats (used in the dashed reminder card). */
    nowLabel: string;
    /** Group name when the poke originated from a group reminder. */
    groupName: string | null;
    reminder: HfL2PokedReminder | null;
  };
}

export function HfL2Poked({ poke }: HfL2PokedProps) {
  const r = poke.reminder;
  return (
    <Phone>
      <div
        data-testid="poked-page"
        style={{
          height: "100%",
          position: "relative",
          background: "var(--poke-soft)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "28px 22px 0", position: "relative" }}>
          <Link
            href="/app/me/notifications"
            data-testid="poked-back"
            className="h-meta"
            style={{
              position: "absolute",
              top: 14,
              left: 22,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ‹
          </Link>
          <div className="h-meta">
            {poke.sentLabel} · {poke.groupName ? `来自 ${poke.groupName}` : "私人"}
          </div>
          <div
            className="hf-chip poke"
            style={{ fontSize: 12, marginTop: 6 }}
          >
            <HF.Icon name="wave" size={11} /> 朋友拍了拍你
          </div>
        </div>

        {/* big poke card */}
        <div style={{ padding: "14px 18px" }}>
          <div
            className="hf-box thick tilt-r"
            style={{
              padding: "18px 16px",
              background: "var(--paper)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <HF.Av name={poke.fromName} size={42} i={poke.fromSlot} />
              <div>
                <div className="h-row" style={{ fontSize: 16 }}>
                  {poke.fromName} 拍了拍你
                </div>
                <div className="h-meta">
                  {r ? `「${r.title}」${poke.tone}` : poke.tone}
                </div>
              </div>
            </div>

            {/* hand-written message */}
            {poke.message && (
              <div
                className="hf-box"
                data-testid="poked-message"
                style={{
                  marginTop: 14,
                  padding: 12,
                  background: "var(--paper-2)",
                  transform: "rotate(-1deg)",
                  fontFamily: "var(--hand-2)",
                  fontSize: 17,
                  lineHeight: 1.5,
                }}
              >
                "{poke.message}"
              </div>
            )}

            {/* the reminder being poked about */}
            {r && (
              <div
                className="hf-box dashed"
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: "var(--paper)",
                  borderColor: "var(--ink-faint)",
                }}
              >
                <div className="h-meta">是这件 ↓</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <span className="hf-check" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h-row" style={{ fontSize: 15 }}>
                      {r.title}
                    </div>
                    {r.originalTime && (
                      <div className="h-meta">
                        原定 {r.originalTime} · 现在 {poke.nowLabel}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* what to do */}
          <div
            className="h-meta"
            style={{
              textAlign: "center",
              marginTop: 16,
              fontFamily: "var(--hand-2)",
              fontSize: 14,
            }}
          >
            没压力 — 选一个就好
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 8,
            }}
          >
            {r ? (
              <Link
                href={`/app/reminders/${r.id}`}
                data-testid="poked-go"
                className="hf-btn primary"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <HF.Icon name="check" size={14} /> 我马上去
              </Link>
            ) : (
              <Link
                href="/app"
                data-testid="poked-ack"
                className="hf-btn primary"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <HF.Icon name="check" size={14} /> 收下
              </Link>
            )}
            {r && (
              <Link
                href={`/app/reminders/${r.id}`}
                data-testid="poked-reschedule"
                className="hf-btn"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <HF.Icon name="clock" size={14} /> 改约时间
              </Link>
            )}
            <Link
              href={`/app/reminders/${r?.id ?? ""}`}
              data-testid="poked-poke-back"
              className="hf-btn ghost"
              style={{ padding: "10px 0", fontSize: 13 }}
            >
              <HF.Icon name="wave" size={13} /> 拍回去 一起做
            </Link>
            <Link
              href="/app"
              data-testid="poked-skip"
              className="hf-btn ghost"
              style={{ padding: "10px 0", fontSize: 13 }}
            >
              <HF.Icon name="shield" size={13} /> 今天先跳
            </Link>
          </div>

          <div
            className="h-meta"
            style={{
              textAlign: "center",
              marginTop: 14,
              fontStyle: "italic",
            }}
          >
            ← 滑掉就当没看见
          </div>
        </div>
      </div>
    </Phone>
  );
}
