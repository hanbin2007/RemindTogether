"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Sparkles } from "@/components/sketch/sparkles";
import { Icon } from "@/components/sketch/icon";
import { completeAction, deleteAction, skipAction } from "./today-actions";
import { LongPressSheet } from "./long-press-sheet";
import { HfL2Reschedule } from "@/components/hf/screens/HfL2Reschedule";

interface Props {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "DONE" | "SKIPPED";
  visibility: "PRIVATE" | "GROUP";
  groupName?: string | null;
  dueAt?: string | null;
  isPinned?: boolean;
  /** Groups available to share to (used by long-press → 分享到群组). */
  groupsAvailable?: Array<{ id: string; name: string; coverEmoji: string | null }>;
  /** Counts to render as right-side chips (HfToday RemRow chip slot). */
  pokeCount?: number;
  claimCount?: number;
  staggerMs?: number;
  /** Compact = inline within a hf-row pattern (used on Today inside the
   * 早上/晚上 cards). Adds a dashed bottom divider unless `last`. */
  compact?: boolean;
  last?: boolean;
}

function timeOfDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * One row in the today/private list. Tapping ✓ optimistically marks
 * itself DONE and fires the celebration sparkles before re-fetching.
 * Status-driven styling keeps SKIPPED rows visually softer.
 *
 * Compact variant matches the design `RemRow` from
 * design/project/hf-shared.jsx — a single line with check + title + sub
 * meta + optional chip / time.
 */
export function ReminderRow({
  id,
  title,
  description,
  status,
  visibility,
  groupName,
  dueAt,
  isPinned = false,
  groupsAvailable = [],
  pokeCount = 0,
  claimCount = 0,
  staggerMs = 0,
  compact = false,
  last = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<"DONE" | "SKIPPED" | null>(null);
  const [showSpark, setShowSpark] = useState(false);
  const [showLP, setShowLP] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  // Long-press detection: hold for 500ms triggers the action sheet.
  const startLongPress = (e: React.PointerEvent | React.TouchEvent) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setShowLP(true);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLP(true);
  };

  const effective = optimistic ?? status;
  const done = effective === "DONE";
  const skipped = effective === "SKIPPED";

  const onComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (done || pending) return;
    setOptimistic("DONE");
    setShowSpark(true);
    setTimeout(() => setShowSpark(false), 700);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await completeAction(fd);
      router.refresh();
    });
  };

  const onSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (skipped || pending) return;
    setOptimistic("SKIPPED");
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await skipAction(fd);
      router.refresh();
    });
  };

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("删掉这条提醒？")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteAction(fd);
      router.refresh();
    });
  };

  const time = timeOfDay(dueAt);
  const subBits: string[] = [];
  if (time) subBits.push(time);
  if (visibility === "GROUP" && groupName) subBits.push(`#${groupName}`);
  else if (visibility === "PRIVATE") subBits.push("私人");
  const sub = subBits.join(" · ");

  if (compact) {
    return (
      <>
      <li
        data-testid={`reminder-row-${id}`}
        data-status={effective}
        className={`rt-row ${showSpark ? "rt-pop" : ""} ${
          skipped ? "opacity-60" : ""
        }`}
        style={{ borderBottom: last ? "none" : undefined }}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onContextMenu={onContextMenu}
      >
        <button
          type="button"
          onClick={onComplete}
          disabled={done || pending}
          aria-label={done ? "已完成" : "标记完成"}
          data-testid={`reminder-row-${id}-complete`}
          className={`rt-check ${done ? "is-done" : ""}`}
          style={{ position: "relative" }}
        >
          {showSpark && <Sparkles />}
        </button>
        <Link
          href={`/app/reminders/${id}`}
          data-testid={`reminder-row-${id}-link`}
          className="flex-1 min-w-0 block"
        >
          <p
            data-testid={`reminder-row-${id}-title`}
            className="rt-h-row truncate"
            style={{
              textDecoration: done ? "line-through" : undefined,
              color: done ? "var(--rt-ink-mute)" : "var(--rt-ink)",
            }}
          >
            {title}
          </p>
          {sub && <p className="rt-h-meta mt-0.5">{sub}</p>}
        </Link>
        {pokeCount > 0 && (
          <span
            data-testid={`reminder-row-${id}-poke-count`}
            className="rt-chip rt-chip-poke"
            style={{ fontSize: 11, padding: "1px 7px" }}
          >
            {pokeCount}× 拍
          </span>
        )}
        {claimCount > 0 && (
          <span
            data-testid={`reminder-row-${id}-claim-count`}
            className="rt-chip rt-chip-claim"
            style={{ fontSize: 11, padding: "1px 7px" }}
          >
            {claimCount} 认领
          </span>
        )}
        {!done && !skipped && (
          <button
            type="button"
            onClick={onSkip}
            disabled={pending}
            data-testid={`reminder-row-${id}-skip`}
            className="rt-h-meta hover:text-rt-ink"
          >
            跳过
          </button>
        )}
      </li>
      <LongPressSheet
        open={showLP}
        onClose={() => setShowLP(false)}
        reminderId={id}
        reminderTitle={title}
        isPinned={isPinned}
        visibility={visibility}
        groups={groupsAvailable}
        onReschedule={() => setShowResched(true)}
      />
      <HfL2Reschedule
        open={showResched}
        onClose={() => setShowResched(false)}
        reminderId={id}
        reminderTitle={title}
        originalDueAt={dueAt ?? null}
      />
      </>
    );
  }

  // Default card variant
  return (
    <>
    <li
      data-testid={`reminder-row-${id}`}
      data-status={effective}
      className={`rt-rise rt-box-tight relative px-4 py-3 ${
        done
          ? "rt-bg-done-soft"
          : skipped
            ? "rt-bg-paper-2 opacity-70"
            : "bg-rt-paper"
      } ${showSpark ? "rt-pop" : ""}`}
      style={{
        borderRadius: "10px 6px 11px 5px / 5px 11px 6px 10px",
        ["--rt-rise-delay" as never]: `${staggerMs}ms`,
      }}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={done || pending}
          aria-label={done ? "已完成" : "标记完成"}
          data-testid={`reminder-row-${id}-complete`}
          className={`relative grid h-6 w-6 flex-shrink-0 place-items-center transition-transform active:scale-95 ${
            done ? "" : ""
          }`}
        >
          <span
            className={`rt-check ${done ? "is-done" : ""}`}
            style={{ width: 22, height: 22 }}
          />
          {showSpark && <Sparkles />}
        </button>
        <Link
          href={`/app/reminders/${id}`}
          data-testid={`reminder-row-${id}-link`}
          className="flex-1 block min-w-0"
        >
          <p
            data-testid={`reminder-row-${id}-title`}
            className="rt-h-row truncate"
            style={{
              textDecoration: done ? "line-through" : undefined,
              color: done ? "var(--rt-ink-mute)" : "var(--rt-ink)",
            }}
          >
            {title}
          </p>
          {description && (
            <p className="rt-h-body truncate mt-0.5">{description}</p>
          )}
          <p className="rt-h-meta mt-0.5">
            {visibility === "GROUP" ? `群 · ${groupName ?? ""}` : "私人"}
            {skipped && " · 跳过日"}
            {time && ` · ${time}`}
          </p>
        </Link>
        <div className="flex flex-col items-end gap-1">
          {!done && !skipped && (
            <button
              type="button"
              onClick={onSkip}
              data-testid={`reminder-row-${id}-skip`}
              className="rt-h-meta hover:text-rt-ink"
            >
              跳过
            </button>
          )}
          {visibility === "PRIVATE" && (
            <button
              type="button"
              onClick={onDelete}
              data-testid={`reminder-row-${id}-delete`}
              className="rt-h-meta hover:text-[color:var(--rt-poke)]"
              aria-label="删除"
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>
    </li>
    <LongPressSheet
      open={showLP}
      onClose={() => setShowLP(false)}
      reminderId={id}
      reminderTitle={title}
      isPinned={isPinned}
      visibility={visibility}
      groups={groupsAvailable}
      onReschedule={() => setShowResched(true)}
    />
    <RescheduleSheet
      open={showResched}
      onClose={() => setShowResched(false)}
      reminderId={id}
      reminderTitle={title}
      originalDueAt={dueAt ?? null}
    />
    </>
  );
}
