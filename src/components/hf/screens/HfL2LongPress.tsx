/**
 * 1:1 port of `window.HfL2LongPress` from
 * design/project/hf-screens-L2.jsx (lines 242-304). The JSX below is a
 * literal copy with three mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data             → typed props (real data)
 *
 * className + inline styles + structure preserved byte-for-byte. The
 * design hard-codes a single static menu; this component selects the
 * actions to render based on visibility / pin state and wires the
 * existing client-island server actions (moveToGroupAction, pinAction,
 * deleteReminderAction) from `src/app/app/(home)/sheet-actions.ts`.
 *
 * Pages: src/app/app/(home)/long-press-sheet.tsx re-exports
 * `LongPressSheet` from this file (the trigger lives in reminder-row).
 */
"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HF } from "@/components/hf";
import {
  deleteReminderAction,
  moveToGroupAction,
  pinAction,
  type LongPressState,
} from "@/app/app/(home)/sheet-actions";
import type { IconName } from "@/components/sketch/icon";

const initial: LongPressState = { ok: false };

export interface HfL2LongPressGroup {
  id: string;
  name: string;
  coverEmoji: string | null;
}

export interface HfL2LongPressProps {
  open: boolean;
  onClose: () => void;
  reminderId: string;
  reminderTitle: string;
  isPinned: boolean;
  visibility: "PRIVATE" | "GROUP";
  /** Groups available to share-to (private reminders only). */
  groups?: HfL2LongPressGroup[];
  /** Open the reschedule sheet. */
  onReschedule: () => void;
}

interface MenuItem {
  key: string;
  ic: IconName;
  t: string;
  sub: string;
  tone?: "ok" | "danger";
  testid: string;
}

export function HfL2LongPress({
  open,
  onClose,
  reminderId,
  reminderTitle,
  isPinned,
  visibility,
  groups = [],
  onReschedule,
}: HfL2LongPressProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [moveState, moveAction] = useActionState(moveToGroupAction, initial);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const onPin = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", reminderId);
    fd.set("pinned", isPinned ? "false" : "true");
    start(async () => {
      await pinAction(fd);
      onClose();
      router.refresh();
    });
  };

  const onDelete = () => {
    if (pending) return;
    if (!confirm(`删掉「${reminderTitle}」？`)) return;
    const fd = new FormData();
    fd.set("id", reminderId);
    start(async () => {
      await deleteReminderAction(fd);
      onClose();
      router.refresh();
    });
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(reminderTitle);
    } catch {
      /* ignore */
    }
    onClose();
  };

  const onReschedClick = () => {
    onClose();
    onReschedule();
  };

  if (!open) return null;

  // Build the action list — different surface for PRIVATE vs GROUP.
  const items: MenuItem[] = [
    ...(visibility === "PRIVATE" && groups.length > 0
      ? [
          {
            key: "share",
            ic: "users" as IconName,
            t: "分享到群组",
            sub: "让朋友也来认领",
            testid: "lp-share",
          },
        ]
      : []),
    {
      key: "reschedule",
      ic: "clock" as IconName,
      t: "改约时间",
      sub: "改时间/内容",
      testid: "lp-reschedule",
    },
    {
      key: "pin",
      ic: "pin" as IconName,
      t: isPinned ? "取消置顶" : "置顶",
      sub: "钉在今天最上面",
      testid: "lp-pin",
    },
    {
      key: "copy",
      ic: "paperclip" as IconName,
      t: "复制内容",
      sub: "复制到剪贴板",
      testid: "lp-copy",
    },
    {
      key: "delete",
      ic: "x" as IconName,
      t: "删除",
      sub: "不再提醒",
      tone: "danger",
      testid: "lp-delete",
    },
  ];

  // Inline group picker sub-sheet for share-to.
  if (showGroupPicker) {
    return (
      <div
        className="hf"
        data-testid="long-press-group-picker"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(40,28,20,0.55)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="hf-box thick"
          style={{
            background: "var(--paper)",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: "8px 14px 18px",
            maxWidth: "37.5rem",
            margin: "0 auto",
            width: "100%",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: 44,
              height: 4,
              background: "var(--ink-faint)",
              borderRadius: 2,
              margin: "4px auto 10px",
            }}
          />
          <div className="h-h3">分享到哪个群？</div>
          <div className="hf-box" style={{ marginTop: 12, padding: "4px 10px" }}>
            {groups.map((g, i, a) => (
              <div
                key={g.id}
                className="hf-row"
                style={{
                  padding: "8px 0",
                  borderBottom:
                    i === a.length - 1
                      ? "none"
                      : "1.3px dashed var(--ink-faint)",
                }}
              >
                <span style={{ fontSize: 22 }}>{g.coverEmoji ?? "📌"}</span>
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>
                    {g.name}
                  </div>
                </div>
                <form action={moveAction}>
                  <input type="hidden" name="id" value={reminderId} />
                  <input type="hidden" name="groupId" value={g.id} />
                  <button
                    type="submit"
                    data-testid={`lp-share-${g.id}`}
                    className="hf-btn primary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    分享
                  </button>
                </form>
              </div>
            ))}
          </div>
          {moveState.message && !moveState.ok && (
            <div
              className="h-meta rt-nudge"
              style={{ marginTop: 8, color: "var(--poke)" }}
            >
              {moveState.message}
            </div>
          )}
          {moveState.ok &&
            moveState.redirect &&
            (() => {
              setTimeout(() => router.push(moveState.redirect!), 300);
              return null;
            })()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="hf"
      data-testid="long-press-sheet"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        height: "100%",
        background: "var(--paper)",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      {/* faux page bg */}
      <div style={{ padding: "14px 18px", opacity: 0.5 }}>
        <div className="h-meta">长按一项</div>
        <div className="h-display">选个动作</div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(40,28,20,0.55)",
        }}
      />

      {/* lifted reminder card */}
      <div style={{ position: "absolute", left: 16, right: 16, top: 110 }}>
        <div
          className="hf-box thick"
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: "10px 12px",
            background: "var(--paper)",
            transform: "scale(1.04) rotate(-1deg)",
            boxShadow: "4px 6px 0 var(--line), 0 0 0 3px var(--poke-soft)",
            maxWidth: "37.5rem",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="hf-check" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-row" style={{ fontSize: 16 }}>
                {reminderTitle}
              </div>
              <div className="h-meta">
                {visibility === "GROUP" ? "群提醒" : "私人提醒"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* context menu — appears below card */}
      <div
        style={{
          position: "absolute",
          left: 30,
          right: 30,
          top: 220,
          maxWidth: "32rem",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div
          className="hf-box thick"
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: 0,
            background: "var(--paper)",
            overflow: "hidden",
          }}
        >
          {items.map((m, i, a) => {
            const handler = (() => {
              switch (m.key) {
                case "share":
                  return () => setShowGroupPicker(true);
                case "reschedule":
                  return onReschedClick;
                case "pin":
                  return onPin;
                case "copy":
                  return onCopy;
                case "delete":
                  return onDelete;
                default:
                  return onClose;
              }
            })();
            return (
              <button
                key={m.key}
                type="button"
                onClick={handler}
                disabled={pending}
                data-testid={m.testid}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderBottom:
                    i === a.length - 1
                      ? "none"
                      : "1.3px dashed var(--ink-faint)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "transparent",
                  textAlign: "left",
                  color:
                    m.tone === "danger"
                      ? "var(--poke)"
                      : m.tone === "ok"
                        ? "var(--ok)"
                        : "var(--ink)",
                }}
              >
                <span style={{ display: "inline-flex" }}>
                  <HF.Icon name={m.ic} size={16} />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    className="h-row"
                    style={{ fontSize: 15, color: "inherit" }}
                  >
                    {m.t}
                  </div>
                  <div className="h-meta">{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="lp-cancel"
          className="h-meta"
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            color: "rgba(255,255,255,0.7)",
            marginTop: 10,
            fontStyle: "italic",
            background: "transparent",
            border: "none",
          }}
        >
          点击空白取消
        </button>
      </div>
    </div>
  );
}
