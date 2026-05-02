/**
 * 1:1 port of the *shell* of `window.HfCreate` (design/project/
 * hf-screens-B.jsx lines 7-77). HfCreate in the design is a bottom
 * sheet floating over a dimmed "今天" backdrop. We wrap the existing
 * form (`/app/reminders/new/create-form.tsx`, itself a literal port of
 * the inner JSX) so the page renders as the design intended:
 *
 *   ┌───────────────────────────┐
 *   │  [date meta]              │   ← faded today preview (top)
 *   │  今天                      │
 *   │  · ─ ─ ─ ─                │
 *   │   [card]                  │
 *   │ ────────  dim mask ─────  │
 *   │ ╭─ sheet ─ ───────────╮   │   ← caller's children
 *   │ │  drag handle bar     │   │
 *   │ │  新提醒  取消 / 创建  │   │
 *   │ │  big title input     │   │
 *   │ │  field cards         │   │
 *   │ │  visibility chips    │   │
 *   │ ╰──────────────────────╯   │
 *   └───────────────────────────┘
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                   → real responsive container
 *   - position: absolute (phone bezel)   → position: fixed (real viewport)
 *   - hardcoded sample today preview     → typed `peekTitle` /
 *     `peekMeta` props so callers can show real today data
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim
 * for the backdrop chrome; the sheet's body is left to the caller.
 */
import type { ReactNode } from "react";

export interface HfCreateProps {
  /** Eyebrow above the today peek (e.g. "星期四 · 4 月 30 日"). */
  peekMeta?: string;
  /** Big peek title (e.g. "今天"). Defaults to "今天". */
  peekTitle?: string;
  /** Sheet body — the form. */
  children: ReactNode;
}

export function HfCreate({
  peekMeta,
  peekTitle = "今天",
  children,
}: HfCreateProps) {
  return (
    <div
      className="hf"
      data-testid="create-sheet-shell"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--paper)",
        maxWidth: "37.5rem",
        margin: "0 auto",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      {/* dimmed today preview */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          padding: "16px 18px",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      >
        {peekMeta && <div className="h-meta">{peekMeta}</div>}
        <div className="h-display">{peekTitle}</div>
        <div
          className="hf-box"
          style={{ marginTop: 14, height: 76 }}
        />
        <div
          className="hf-box"
          style={{ marginTop: 10, height: 140 }}
        />
      </div>

      {/* dim mask */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,26,26,0.18)",
        }}
      />

      {/* sheet — pinned to bottom, scroll inside if tall */}
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 6,
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
