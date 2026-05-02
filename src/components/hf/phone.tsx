/**
 * Replacement for the design's `<Phone>` wrapper.
 *
 * The artboards drew a 320×660 phone bezel (`hf-phone` + status bar +
 * home indicator) so the JSX could be displayed inside a static design
 * canvas. In the real app we drop the bezel entirely and render a
 * responsive column:
 *
 *   - mobile  : full width, naturally
 *   - tablet+ : centered max-width 600px (paper feel preserved)
 *
 * Inner screens render `<Phone>...</Phone>` exactly as written in
 * `design/project/hf-screens-*.jsx`.
 */
import type { ReactNode } from "react";

export function Phone({ children }: { children: ReactNode }) {
  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        maxWidth: "37.5rem", // 600px on default 16px root
        margin: "0 auto",
        minHeight: "100dvh",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
