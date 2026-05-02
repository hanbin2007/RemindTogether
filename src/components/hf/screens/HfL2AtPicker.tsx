"use client";

/**
 * 1:1 port of `window.HfL2AtPicker` from
 * design/project/hf-screens-L2.jsx (lines 581-661). The JSX below is a
 * literal copy with the standard mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (kept)
 *   - <SheetOverlay>                    → our open/onClose-driven SheetOverlay
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - <window.HF.Av ...>                → <HF.Av ... />
 *   - hardcoded sample people           → typed `members` + `recentlyPicked`
 *
 * className + inline styles + structure preserved byte-for-byte.
 *
 * Pages: src/app/app/reminders/new/create-form.tsx renders this in the
 * assignee-pick flow.
 */
import { useMemo, useState } from "react";
import { Phone, HF, SheetOverlay } from "@/components/hf";
import { avatarSlot } from "@/components/sketch/avatar";

export interface HfL2AtPickerMember {
  userId: string;
  displayName: string;
  /** Avatar slot (0–7). Computed by caller; defaults to hash of userId. */
  slot?: number;
  /** Optional sub-line e.g. "在线 · 30 秒前" — caller composes. */
  sub?: string;
  /** Render row at reduced opacity (e.g. inactive member). */
  dim?: boolean;
}

export interface HfL2AtPickerProps {
  open: boolean;
  onClose: () => void;
  /** Group whose members are listed. Used in the "「X」群成员" header. */
  groupId: string;
  /** Group name, optional — falls back to "群成员" copy if absent. */
  groupName?: string;
  /** Group members to choose from. */
  members: HfL2AtPickerMember[];
  /** User ids the user picked recently (most-recent first). Renders as
   *  the chip strip above the search results. */
  recentlyPicked?: string[];
  /** Click handler — fires with the picked user id, then closes. */
  onPick: (userId: string) => void;
}

export function HfL2AtPicker({
  open,
  onClose,
  groupId: _groupId,
  groupName,
  members,
  recentlyPicked = [],
  onPick,
}: HfL2AtPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [members, query]);

  const recentMembers = useMemo(() => {
    if (recentlyPicked.length === 0) return [];
    const byId = new Map(members.map((m) => [m.userId, m]));
    return recentlyPicked
      .map((id) => byId.get(id))
      .filter((m): m is HfL2AtPickerMember => Boolean(m));
  }, [members, recentlyPicked]);

  function handlePick(userId: string) {
    onPick(userId);
    onClose();
  }

  return (
    <Phone>
      <SheetOverlay
        open={open}
        onClose={onClose}
        height={520}
      >
        <div data-testid="at-picker-sheet" style={{ padding: "0 18px" }}>
          <div className="h-meta">@ 提一下</div>
          <div className="h-h2" style={{ marginTop: 2 }}>谁来记这个？</div>
          <div className="h-body" style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 4 }}>
            可以多选 — ta 们都会收到
          </div>

          {/* search */}
          <div className="hf-box" style={{ marginTop: 12, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <HF.Icon name="search" size={14} color="var(--ink-faint)" />
            <input
              data-testid="at-picker-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜名字"
              className="h-meta"
              style={{
                flex: 1,
                fontFamily: "var(--hand-2)",
                fontSize: 14,
                color: "var(--ink)",
                background: "transparent",
                border: "none",
                outline: "none",
              }}
            />
          </div>

          {/* recent */}
          {recentMembers.length > 0 && (
            <>
              <div className="h-meta" style={{ marginTop: 12 }}>最近一起做</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {recentMembers.map((p) => {
                  const slot = p.slot ?? avatarSlot(p.userId);
                  return (
                    <button
                      key={p.userId}
                      type="button"
                      onClick={() => handlePick(p.userId)}
                      data-testid={`at-picker-recent-${p.userId}`}
                      className="hf-chip"
                      style={{
                        padding: "4px 10px 4px 4px",
                        gap: 6,
                        background: "var(--paper)",
                        color: "var(--ink)",
                        borderColor: "var(--line)",
                      }}
                    >
                      <HF.Av name={p.displayName} size={20} i={slot} />
                      {p.displayName}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* group list */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            {groupName ? `「${groupName}」群成员` : "群成员"}
          </div>
          <div className="hf-box" style={{ marginTop: 4, padding: "4px 10px" }}>
            {filtered.length === 0 ? (
              <div
                className="h-meta"
                style={{ padding: "10px 0", textAlign: "center", fontStyle: "italic" }}
                data-testid="at-picker-empty"
              >
                没找到这个人
              </div>
            ) : (
              filtered.map((p, i, a) => {
                const slot = p.slot ?? avatarSlot(p.userId);
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() => handlePick(p.userId)}
                    data-testid={`at-picker-member-${p.userId}`}
                    className="hf-row"
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderBottom: i === a.length - 1 ? "none" : "1.3px dashed var(--ink-faint)",
                      opacity: p.dim ? 0.7 : 1,
                      background: "transparent",
                      textAlign: "left",
                    }}
                  >
                    <span className="hf-check" />
                    <HF.Av name={p.displayName} size={28} i={slot} />
                    <div style={{ flex: 1 }}>
                      <div className="h-row" style={{ fontSize: 14 }}>{p.displayName}</div>
                      {p.sub && <div className="h-meta">{p.sub}</div>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="h-meta">点头像加上 ta</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="at-picker-cancel"
              className="hf-btn ghost"
              style={{ padding: "8px 16px" }}
            >
              取消
            </button>
          </div>
        </div>
      </SheetOverlay>
    </Phone>
  );
}
