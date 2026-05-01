"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "@/components/sketch/sparkles";
import { completeAction, deleteAction, skipAction } from "./today-actions";

interface Props {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "DONE" | "SKIPPED";
  visibility: "PRIVATE" | "GROUP";
  groupName?: string | null;
  staggerMs?: number;
}

/**
 * One row in the today/private list. Tapping ✓ optimistically marks
 * itself DONE and fires the celebration sparkles before re-fetching.
 * Status-driven styling keeps SKIPPED rows visually softer.
 */
export function ReminderRow({
  id,
  title,
  description,
  status,
  visibility,
  groupName,
  staggerMs = 0,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<"DONE" | "SKIPPED" | null>(null);
  const [showSpark, setShowSpark] = useState(false);

  const effective = optimistic ?? status;
  const done = effective === "DONE";
  const skipped = effective === "SKIPPED";

  const onComplete = () => {
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

  const onSkip = () => {
    if (skipped || pending) return;
    setOptimistic("SKIPPED");
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await skipAction(fd);
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!confirm("删掉这条提醒？")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await deleteAction(fd);
      router.refresh();
    });
  };

  return (
    <li
      data-testid={`reminder-row-${id}`}
      data-status={effective}
      className={`rt-rise rt-box-tight relative px-4 py-3 ${
        done
          ? "bg-[color:var(--rt-done-soft,#e6f3e6)]"
          : skipped
            ? "bg-rt-paper-2 opacity-70"
            : "bg-rt-paper"
      } ${showSpark ? "rt-pop" : ""}`}
      style={{
        borderRadius: "10px 6px 11px 5px / 5px 11px 6px 10px",
        ["--rt-rise-delay" as never]: `${staggerMs}ms`,
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onComplete}
          disabled={done || pending}
          aria-label={done ? "已完成" : "标记完成"}
          data-testid={`reminder-row-${id}-complete`}
          className={`relative grid h-6 w-6 flex-shrink-0 place-items-center border-[1.6px] border-rt-ink ${
            done ? "bg-rt-ink" : "bg-rt-paper"
          } transition-transform active:scale-95`}
          style={{ borderRadius: "5px 4px 6px 3px / 3px 6px 4px 5px" }}
        >
          {done && (
            <svg viewBox="0 0 18 18" className="h-4 w-4">
              <path
                className="rt-check-path"
                d="M4 9.5 L7.5 13 L14 5.5"
                fill="none"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {showSpark && <Sparkles />}
        </button>

        <Link
          href={`/app/reminders/${id}`}
          data-testid={`reminder-row-${id}-link`}
          className="flex-1 block"
        >
          <p
            data-testid={`reminder-row-${id}-title`}
            className={`font-[family-name:var(--font-caveat)] font-semibold text-rt-ink text-lg leading-tight ${
              done ? "line-through opacity-70" : ""
            }`}
          >
            {title}
          </p>
          {description && (
            <p className="mt-0.5 font-[family-name:var(--font-kalam)] text-sm text-rt-ink-soft leading-snug">
              {description}
            </p>
          )}
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
            {visibility === "GROUP" ? `群 · ${groupName ?? ""}` : "私人"}
            {skipped && " · 跳过日"}
          </p>
        </Link>

        <div className="flex flex-col items-end gap-1">
          {!done && !skipped && (
            <button
              type="button"
              onClick={onSkip}
              data-testid={`reminder-row-${id}-skip`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute hover:text-rt-ink"
            >
              跳过
            </button>
          )}
          {visibility === "PRIVATE" && (
            <button
              type="button"
              onClick={onDelete}
              data-testid={`reminder-row-${id}-delete`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute hover:text-[color:var(--rt-poke)]"
            >
              删
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
