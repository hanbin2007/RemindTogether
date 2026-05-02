/**
 * 1:1 port of design/project/hf-shared.jsx `RemRow` (lines 71-83).
 *
 *   <div className="hf-row" style={{ borderBottom: last ? 'none' : '1.3px dashed var(--ink-faint)' }}>
 *     <span className={`hf-check ${done ? 'done' : ''}`} />
 *     <div style={{ flex: 1, minWidth: 0 }}>
 *       <div className="h-row" style={{ ... }}>{title}</div>
 *       {sub && <div className="h-meta" style={{ marginTop: 1 }}>{sub}</div>}
 *     </div>
 *     {time && <div className="h-meta" ...>{time}</div>}
 *     {chip}
 *   </div>
 *
 * Props are an exact mirror of the design's call sites. `onComplete` /
 * `onClick` / etc. are added so the ported screens can wire real
 * server actions without changing the JSX shape.
 */
import type { ReactNode, MouseEvent } from "react";
import Link from "next/link";

interface Props {
  /** Forwarded to the `<a>` so a tap on the row navigates to detail. */
  href?: string;
  title: string;
  sub?: string;
  time?: string;
  done?: boolean;
  chip?: ReactNode;
  last?: boolean;
  /** Click on the check toggles complete. */
  onComplete?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Long-press / right-click. */
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
  testid?: string;
}

export function RemRow({
  href,
  title,
  sub,
  time,
  done,
  chip,
  last,
  onComplete,
  onContextMenu,
  testid,
}: Props) {
  const TitleEl = href ? Link : "div";
  return (
    <div
      className="hf-row"
      data-testid={testid}
      data-status={done ? "DONE" : "ACTIVE"}
      style={{
        borderBottom: last ? "none" : "1.3px dashed var(--ink-faint)",
      }}
      onContextMenu={onContextMenu}
    >
      <button
        type="button"
        onClick={onComplete}
        disabled={done || !onComplete}
        aria-label={done ? "已完成" : "标记完成"}
        data-testid={testid ? `${testid}-complete` : undefined}
        className={`hf-check ${done ? "done" : ""}`}
        style={{ cursor: onComplete ? "pointer" : "default" }}
      />
      <TitleEl
        // @ts-expect-error — Link needs href; div ignores it
        href={href}
        data-testid={testid ? `${testid}-link` : undefined}
        style={{
          flex: 1,
          minWidth: 0,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          className="h-row"
          style={{
            textDecoration: done ? "line-through" : "none",
            color: done ? "var(--ink-mute)" : "var(--ink)",
          }}
          data-testid={testid ? `${testid}-title` : undefined}
        >
          {title}
        </div>
        {sub && (
          <div className="h-meta" style={{ marginTop: 1 }}>
            {sub}
          </div>
        )}
      </TitleEl>
      {time && (
        <div
          className="h-meta"
          style={{ alignSelf: "flex-start", marginTop: 4 }}
        >
          {time}
        </div>
      )}
      {chip}
    </div>
  );
}
