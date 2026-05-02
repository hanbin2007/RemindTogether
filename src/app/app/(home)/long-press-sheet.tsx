"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/sketch/icon";
import {
  deleteReminderAction,
  moveToGroupAction,
  pinAction,
  type LongPressState,
} from "./sheet-actions";

const initial: LongPressState = { ok: false };

interface Group {
  id: string;
  name: string;
  coverEmoji: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  reminderId: string;
  reminderTitle: string;
  isPinned: boolean;
  visibility: "PRIVATE" | "GROUP";
  /** Groups available to move-to (private reminders only). */
  groups?: Group[];
  /** Open the reschedule sheet. */
  onReschedule: () => void;
}

interface Action {
  key: string;
  label: string;
  icon: IconName;
  color?: string;
  testid: string;
}

/**
 * HfL2LongPress — full-screen overlay with the lifted reminder card +
 * an action sheet at the bottom. Mirrors design/project/hf-screens-L2.jsx
 * lines 242-318.
 *
 * Trigger: long-press (touchstart held > 500ms) on a reminder row, or
 * the contextmenu (right-click) event on desktop. Both are wired in
 * reminder-row.tsx.
 */
export function LongPressSheet({
  open,
  onClose,
  reminderId,
  reminderTitle,
  isPinned,
  visibility,
  groups = [],
  onReschedule,
}: Props) {
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
  const actions: Action[] = [
    ...(visibility === "PRIVATE" && groups.length > 0
      ? [
          {
            key: "share",
            label: "分享到群组",
            icon: "users" as IconName,
            testid: "lp-share",
          },
        ]
      : []),
    {
      key: "reschedule",
      label: "改约时间",
      icon: "clock" as IconName,
      testid: "lp-reschedule",
    },
    {
      key: "pin",
      label: isPinned ? "取消置顶" : "置顶",
      icon: "pin" as IconName,
      testid: "lp-pin",
    },
    {
      key: "copy",
      label: "复制内容",
      icon: "paperclip" as IconName,
      testid: "lp-copy",
    },
    {
      key: "delete",
      label: "删除",
      icon: "x" as IconName,
      color: "var(--rt-poke)",
      testid: "lp-delete",
    },
  ];

  if (showGroupPicker) {
    return (
      <div
        data-testid="long-press-group-picker"
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(40,28,20,0.55)" }}
        onClick={onClose}
      >
        <div
          className="rt-box rt-box-thick w-full max-w-xl px-4 pt-3 pb-5"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--rt-paper)",
            borderRadius: "20px 18px 0 0 / 16px 22px 0 0",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <div
            className="mx-auto"
            style={{
              width: 40,
              height: 4,
              background: "var(--rt-ink-faint)",
              borderRadius: 2,
              marginBottom: 10,
            }}
          />
          <h2 className="rt-h-h3">分享到哪个群？</h2>
          <ul className="rt-box px-3 mt-3">
            {groups.map((g, i) => (
              <li
                key={g.id}
                className="rt-row"
                style={{
                  borderBottom:
                    i === groups.length - 1 ? "none" : undefined,
                }}
              >
                <span className="text-2xl">{g.coverEmoji ?? "📌"}</span>
                <p className="rt-h-row flex-1">{g.name}</p>
                <form action={moveAction}>
                  <input type="hidden" name="id" value={reminderId} />
                  <input type="hidden" name="groupId" value={g.id} />
                  <button
                    type="submit"
                    data-testid={`lp-share-${g.id}`}
                    className="rt-btn rt-btn-primary"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                  >
                    分享
                  </button>
                </form>
              </li>
            ))}
          </ul>
          {moveState.message && !moveState.ok && (
            <p
              className="rt-h-meta mt-2 rt-nudge"
              style={{ color: "var(--rt-poke)" }}
            >
              {moveState.message}
            </p>
          )}
          {moveState.ok && moveState.redirect && (() => {
            // route on success
            setTimeout(() => router.push(moveState.redirect!), 300);
            return null;
          })()}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="long-press-sheet"
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(40,28,20,0.55)" }}
      onClick={onClose}
    >
      {/* lifted reminder card preview */}
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div
          className="rt-box rt-box-thick rt-tilt-l max-w-md w-full px-4 py-3"
          onClick={(e) => e.stopPropagation()}
          style={{ background: "var(--rt-paper)" }}
        >
          <p className="rt-h-row" style={{ fontSize: 17 }}>
            {reminderTitle}
          </p>
          <p className="rt-h-meta mt-1">长按一项 — 选个动作</p>
        </div>
      </div>
      {/* action sheet */}
      <div
        className="rt-box rt-box-thick px-3 py-2"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--rt-paper)",
          borderRadius: "20px 18px 0 0 / 16px 22px 0 0",
          maxWidth: "var(--rt-max-w, 36rem)",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: 40,
            height: 4,
            background: "var(--rt-ink-faint)",
            borderRadius: 2,
            marginBottom: 6,
          }}
        />
        <ul>
          {actions.map((a, i) => {
            const handler = (() => {
              switch (a.key) {
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
              <li
                key={a.key}
                style={{
                  borderBottom:
                    i === actions.length - 1
                      ? "none"
                      : "1.3px dashed var(--rt-ink-faint)",
                }}
              >
                <button
                  type="button"
                  onClick={handler}
                  disabled={pending}
                  data-testid={a.testid}
                  className="w-full flex items-center gap-3 py-3 text-left"
                  style={{ color: a.color ?? "var(--rt-ink)" }}
                >
                  <Icon name={a.icon} size={16} />
                  <span className="rt-h-row" style={{ fontSize: 16 }}>
                    {a.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={onClose}
          data-testid="lp-cancel"
          className="rt-btn rt-btn-ghost w-full mt-2"
          style={{ padding: "10px 0", fontSize: 14 }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
