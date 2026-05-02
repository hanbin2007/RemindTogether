"use client";

/**
 * Replacements for the design's `<SheetOverlay>` (hf-screens-L2.jsx
 * lines 6-34) and the bottom sheet pattern used in HfL2SkipDay /
 * HfL2Reschedule / HfL2NewGroup / HfL2AtPicker.
 *
 *   - `<SheetOverlay peek="今天" height={420}>`  — design's full faux-bg + dim + sheet
 *   - `<Sheet>`                                  — bare sheet (used inside Phone)
 *
 * The full SheetOverlay is mostly wireframe noise (faux content peeks
 * through dim). We render just the dim + sheet here — the real page
 * underneath stays visible because the sheet portals into the body.
 *
 * Both components are fully responsive: full width on mobile, max
 * 600px column on tablet+.
 */
import type { ReactNode } from "react";

export function SheetOverlay({
  open,
  onClose,
  height = 460,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Soft cap; on mobile we let it grow up to 90vh with internal scroll. */
  height?: number;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="hf"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(40,28,20,0.32)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          borderTop: "2px solid var(--ink)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -4px 0 var(--line)",
          padding: "8px 0 14px",
          maxWidth: "37.5rem",
          margin: "0 auto",
          width: "100%",
          maxHeight: `min(${height}px, 90vh)`,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            background: "var(--ink-faint)",
            borderRadius: 2,
            margin: "4px auto 8px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

/** Inline sheet (already inside Phone). Just the rounded paper card. */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: "8px 0 14px",
      }}
    >
      <div
        style={{
          width: 44,
          height: 4,
          background: "var(--ink-faint)",
          borderRadius: 2,
          margin: "4px auto 8px",
        }}
      />
      {children}
    </div>
  );
}
