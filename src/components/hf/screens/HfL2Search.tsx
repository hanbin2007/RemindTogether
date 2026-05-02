/**
 * 1:1 port of `window.HfL2Search` (design/project/hf-screens-L2.jsx
 * lines 747-825) combined with `window.HfL2SearchEmpty` (lines 1332-1379).
 * The JSX below is a literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design hard-codes a single sample query / sample hits; this component
 * groups the real `globalSearch` results by kind and renders the empty-
 * state branch when `query` is non-empty and there are zero results.
 *
 * Pages: src/app/app/search/page.tsx  fetches data and renders this.
 */
import Link from "next/link";
import type { IconName } from "@/components/sketch/icon";
import { Phone, HF } from "@/components/hf";

export type HfL2SearchHitKind = "reminder" | "group" | "person";

export interface HfL2SearchHit {
  kind: HfL2SearchHitKind;
  id: string;
  title: string;
  sub: string | null;
  href: string;
}

export interface HfL2SearchProps {
  /** Current ?q=... value. Empty string when no search active. */
  query: string;
  /** Combined ranked hits from globalSearch. */
  results: HfL2SearchHit[];
  /** Recent queries shown when `query` is empty. */
  recentQueries?: string[];
}

const POPULAR_QUERIES = ["#看动画", "小新", "画画", "周日", "读书", "运动"];

function iconForKind(kind: HfL2SearchHitKind): IconName {
  return kind === "reminder" ? "check" : kind === "group" ? "users" : "smile";
}

function sectionTitleForKind(kind: HfL2SearchHitKind): string {
  return kind === "reminder" ? "提醒" : kind === "group" ? "群组" : "人";
}

export function HfL2Search({
  query,
  results,
  recentQueries = [],
}: HfL2SearchProps) {
  const showEmpty = query.length > 0 && results.length === 0;

  // Group results by kind, preserving server-side ranking inside each bucket.
  const grouped: Record<HfL2SearchHitKind, HfL2SearchHit[]> = {
    reminder: [],
    group: [],
    person: [],
  };
  for (const r of results) grouped[r.kind].push(r);
  const order: HfL2SearchHitKind[] = ["group", "reminder", "person"];

  return (
    <Phone>
      <div
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        <form
          action="/app/search"
          method="get"
          data-testid="search-form"
          style={{
            padding: "12px 14px",
            borderBottom: "1.5px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link
            href="/app"
            aria-label="返回"
            style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}
          >
            ‹
          </Link>
          <div
            className="hf-box"
            style={{
              flex: 1,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <HF.Icon name="search" size={14} />
            <input
              name="q"
              defaultValue={query}
              placeholder="找提醒、群、朋友"
              autoFocus
              data-testid="search-input"
              style={{
                border: "none",
                outline: "none",
                flex: 1,
                fontFamily: "var(--hand)",
                fontSize: 16,
                background: "transparent",
              }}
            />
            {query && (
              <Link
                href="/app/search"
                data-testid="search-clear"
                aria-label="清空"
              >
                <HF.Icon name="x" size={12} color="var(--ink-faint)" />
              </Link>
            )}
          </div>
        </form>

        <div
          style={{
            padding: "12px 14px",
            overflowY: "auto",
            height: "calc(100% - 56px)",
          }}
        >
          {/* recent / popular queries when no query active */}
          {!query && recentQueries.length > 0 && (
            <>
              <div className="h-meta">最近搜过</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {recentQueries.map((t, i) => (
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
            </>
          )}

          {/* empty state — query but zero hits */}
          {showEmpty && (
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
                {POPULAR_QUERIES.map((t, i) => (
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
            </div>
          )}

          {/* result list — grouped by kind */}
          {results.length > 0 && (
            <div data-testid="search-results">
              {order.map((kind) => {
                const bucket = grouped[kind];
                if (bucket.length === 0) return null;
                return (
                  <div key={kind}>
                    <div className="h-meta" style={{ marginTop: 14 }}>
                      {sectionTitleForKind(kind)}
                    </div>
                    <div
                      className="hf-box"
                      style={{ marginTop: 4, padding: "4px 10px" }}
                    >
                      {bucket.map((h, i, a) => (
                        <Link
                          key={`${h.kind}-${h.id}`}
                          href={h.href}
                          data-testid={`search-result-${h.kind}-${h.id}`}
                          className="hf-row"
                          style={{
                            padding: "7px 0",
                            borderBottom:
                              i === a.length - 1
                                ? "none"
                                : "1.3px dashed var(--ink-faint)",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span style={{ display: "inline-flex" }}>
                            <HF.Icon
                              name={iconForKind(h.kind)}
                              size={14}
                            />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="h-row"
                              style={{ fontSize: 14 }}
                            >
                              {h.title}
                            </div>
                            {h.sub && (
                              <div className="h-meta">{h.sub}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Phone>
  );
}
