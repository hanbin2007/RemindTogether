/**
 * 1:1 port of `window.HfL2SearchEmpty` (design/project/hf-screens-L2.jsx
 * lines 1332-1379). Used by `HfL2Search` when the user has typed a
 * query but the server returned zero hits.
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                   → dropped (caller owns chrome)
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded "蜡笔小新" sample query  → typed `query` prop
 *   - hardcoded "试试看" chip set        → typed `popularQueries` prop
 *
 * className + inline styles + structure preserved byte-for-byte.
 */
import Link from "next/link";
import { HF } from "@/components/sketch/hf";

export interface HfL2SearchEmptyProps {
  /** The query the user typed (e.g. "蜡笔小新"). */
  query: string;
  /** Popular query chips offered as fallbacks. */
  popularQueries: string[];
  /**
   * Optional href to "把『query』变成新提醒". When provided, the green
   * CTA card is rendered below the popular chips. Pass `null` to hide.
   */
  createHref?: string | null;
}

export function HfL2SearchEmpty({
  query,
  popularQueries,
  createHref,
}: HfL2SearchEmptyProps) {
  return (
    <div
      data-testid="search-empty"
      style={{ padding: "40px 22px 0", textAlign: "center" }}
    >
      <div
        className="hf-box dashed"
        style={{
          width: 84,
          height: 84,
          padding: 0,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper-2)",
          transform: "rotate(-3deg)",
        }}
      >
        <HF.Icon name="search" size={42} color="var(--ink-faint)" />
      </div>

      <div className="h-h2" style={{ marginTop: 16 }}>
        没找到「{query}」
      </div>
      <div
        className="h-body"
        style={{
          fontFamily: "var(--hand-2)",
          fontSize: 15,
          marginTop: 6,
          color: "var(--ink-mute)",
        }}
      >
        试试其他关键字 — 没找到你的提醒、群、朋友
      </div>

      <div className="h-meta" style={{ marginTop: 18 }}>
        试试看
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
          marginTop: 6,
        }}
      >
        {popularQueries.map((t, i) => (
          <Link
            key={i}
            href={`/app/search?q=${encodeURIComponent(t)}`}
            className="hf-chip"
            style={{ fontSize: 13 }}
          >
            {t}
          </Link>
        ))}
      </div>

      {createHref && (
        <div
          className="hf-box thick"
          style={{
            marginTop: 26,
            padding: 14,
            background: "var(--ok-soft)",
          }}
          data-testid="search-empty-create"
        >
          <div className="h-row" style={{ fontSize: 14 }}>
            把「{query}」<br />
            变成新提醒？
          </div>
          <div className="h-meta" style={{ marginTop: 4 }}>
            朋友也可以来看
          </div>
          <Link
            href={createHref}
            className="hf-btn primary"
            style={{
              marginTop: 8,
              padding: "8px 16px",
              fontSize: 14,
              display: "inline-block",
            }}
          >
            + 新建
          </Link>
        </div>
      )}
    </div>
  );
}
