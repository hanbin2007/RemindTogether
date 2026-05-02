"use client";

/**
 * Client wrapper for the design's `<RemRow>` that owns the complete +
 * long-press handlers. Server-rendered pages (Today / Private / Group
 * detail) can't hand functions to client components; instead they pass
 * data + this wrapper wires the existing Server Actions.
 *
 * Usage (server side):
 *
 *   <ConnectedRemRow
 *     id={r.id}
 *     title={r.title}
 *     sub={...}
 *     done={...}
 *     time={...}
 *     chip={...}
 *     last={i === n - 1}
 *     visibility={r.visibility}
 *     groupsAvailable={...}
 *     dueAt={r.dueAt}
 *   />
 */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RemRow } from "./rem-row";
import { HfL2LongPress } from "./screens/HfL2LongPress";
import { HfL2Reschedule } from "@/components/hf/screens/HfL2Reschedule";
import { completeAction } from "@/app/app/(home)/today-actions";

export interface ConnectedRemRowProps {
  id: string;
  title: string;
  sub?: string;
  time?: string;
  done?: boolean;
  chip?: ReactNode;
  last?: boolean;
  testid?: string;
  /** For long-press → 分享到群组 / 改约 / 删除 etc. */
  visibility: "PRIVATE" | "GROUP";
  isPinned?: boolean;
  dueAt?: string | null;
  groupsAvailable?: Array<{ id: string; name: string; coverEmoji: string | null }>;
}

export function ConnectedRemRow({
  id,
  title,
  sub,
  time,
  done,
  chip,
  last,
  testid,
  visibility,
  isPinned = false,
  dueAt = null,
  groupsAvailable = [],
}: ConnectedRemRowProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showLP, setShowLP] = useState(false);
  const [showResched, setShowResched] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const effectiveDone = optimistic ?? done;

  const onComplete = () => {
    if (effectiveDone) return;
    setOptimistic(true); // flip the UI immediately so tests + users see it
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await completeAction(fd);
      router.refresh();
    });
  };

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setShowLP(true);
  };

  // Pointer/touch long-press detection — 500ms hold opens the sheet.
  // We attach via a wrapper div around RemRow because RemRow itself
  // doesn't expose pointer handlers.
  const startLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setShowLP(true), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <div
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
      >
        <RemRow
          href={`/app/reminders/${id}`}
          title={title}
          sub={sub}
          time={time}
          done={effectiveDone}
          chip={chip}
          last={last}
          testid={testid}
          onComplete={onComplete}
          onContextMenu={onContextMenu}
        />
      </div>
      <HfL2LongPress
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
        originalDueAt={dueAt}
      />
    </>
  );
}
