"use client";

/**
 * 1:1 port of `window.HfL2ShieldConfirm` from
 * design/project/hf-screens-L2.jsx (lines 1082-1131). Standard
 * mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (kept)
 *   - design's full-screen dim chrome   → our `SheetOverlay`
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded "{1,2,3}.map" tile loop → real cardsLeft / cap
 *   - hardcoded "用掉后剩 2 张"         → derived from cardsLeft - 1
 *
 * Rendered as a confirmation gate IN FRONT OF the SkipDay sheet —
 * caller wires onConfirm to `skipDayAction`.
 */
import { Phone, HF, SheetOverlay } from "@/components/hf";

export interface HfL2ShieldConfirmProps {
  open: boolean;
  onClose: () => void;
  /** How many shield cards remain right now (BEFORE consuming). */
  cardsLeft: number;
  /** The user's weekly cap. Drives the tile count + "周一补满" copy. */
  cap: number;
  /** How far into the week we are (1 = Mon, 7 = Sun). Reserved for
   *  future use; not rendered in the current design but kept on the
   *  contract so callers can pass it without churn. */
  weekDayCount: number;
  /** Confirm handler. Caller is responsible for invoking the
   *  skipDayAction (or whatever consumes the card). */
  onConfirm: () => void;
  /** Show the disabled+pending state on the primary button. */
  pending?: boolean;
}

export function HfL2ShieldConfirm({
  open,
  onClose,
  cardsLeft,
  cap,
  weekDayCount: _weekDayCount,
  onConfirm,
  pending = false,
}: HfL2ShieldConfirmProps) {
  // Tile count mirrors the design's [1,2,3].map; we drive it from cap
  // so users with custom caps see all their slots. Each tile is "owned"
  // when its index <= cardsLeft.
  const slots = Math.max(cap, 3);
  const remainingAfter = Math.max(cardsLeft - 1, 0);

  return (
    <Phone>
      <SheetOverlay open={open} onClose={onClose} height={440}>
        <div data-testid="shield-confirm-sheet" style={{ padding: "0 18px" }}>
          <div className="hf-box thick" style={{ padding: "20px 18px", background: "var(--paper)", textAlign: "center" }}>
            <div className="hf-box thick" style={{
              width: 72, height: 88, padding: 0, margin: "0 auto",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--ok-soft)", borderColor: "var(--ok)",
              transform: "rotate(-4deg)",
            }}>
              <HF.Icon name="shield" size={42} color="var(--ok)" />
            </div>

            <div className="h-h2" style={{ marginTop: 14 }}>用 1 张保护卡？</div>
            <div className="h-body" style={{ fontFamily: "var(--hand-2)", fontSize: 16, marginTop: 6, lineHeight: 1.5 }}>
              今天的事先放过 — <b style={{ color: "var(--ok)" }}>连胜不会断</b>
            </div>

            <div className="hf-box dashed" style={{ marginTop: 14, padding: 10, background: "var(--paper-2)" }}>
              <div className="h-meta">本周还有</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6 }}>
                {Array.from({ length: slots }).map((_, idx) => {
                  const i = idx + 1;
                  return (
                    <HF.Icon
                      key={i} name="shield" size={26}
                      color={i <= cardsLeft ? "var(--ok)" : "var(--ink-faint)"}
                    />
                  );
                })}
              </div>
              <div className="h-meta" style={{ marginTop: 4 }}>
                用掉后剩 {remainingAfter} 张 · 周一补满
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                data-testid="shield-confirm-cancel"
                className="hf-btn ghost"
                style={{ flex: 1, padding: "10px 0" }}
              >
                不用
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending || cardsLeft <= 0}
                data-testid="shield-confirm-yes"
                className="hf-btn primary"
                style={{ flex: 1.5, padding: "10px 0", background: "var(--ok)" }}
              >
                {pending ? "用掉…" : "用 1 张"}
              </button>
            </div>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
}
