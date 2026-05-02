"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/sketch/icon";
import { acceptPokeAction, dismissPokeAction } from "./poke-alert-actions";

const TONE_LABEL: Record<string, string> = {
  ALMOST: "差一点点",
  THINKING: "想到你了",
  NO_RUSH: "不急慢慢来",
};

interface Props {
  poke: {
    id: string;
    fromName: string;
    tone: string;
    message: string | null;
    sentAt: string;
    reminderId: string | null;
    reminderTitle: string | null;
    groupName: string | null;
  };
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}

/**
 * Top-of-Today softened poke alert. Mirrors HfToday lines 44-61. The
 * "收下，去做" CTA marks read + (if a reminder is attached) routes to it.
 * "晚点说" just marks read. "跳过日" marks read and routes to today skip.
 */
export function PokeAlert({ poke }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onAccept = () => {
    const fd = new FormData();
    fd.set("id", poke.id);
    start(async () => {
      await acceptPokeAction(fd);
      if (poke.reminderId) {
        router.push(`/app/reminders/${poke.reminderId}`);
      }
      router.refresh();
    });
  };

  const onLater = () => {
    const fd = new FormData();
    fd.set("id", poke.id);
    start(async () => {
      await dismissPokeAction(fd);
      router.refresh();
    });
  };

  return (
    <div
      data-testid="poke-alert"
      className="rt-box rt-box-thick rt-tilt-l rt-poke-arrival px-3 py-2.5 mb-3"
      style={{ background: "var(--rt-poke-soft)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="inline-flex rt-text-poke">
          <Icon name="wave" size={16} />
        </span>
        <p className="rt-h-meta rt-text-poke">
          {poke.fromName} {TONE_LABEL[poke.tone] ?? "想到你了"} · {timeAgo(poke.sentAt)}
        </p>
      </div>
      {poke.message && (
        <p
          className="rt-h-h3"
          style={{
            fontFamily: "var(--font-kalam), Kalam, sans-serif",
            lineHeight: 1.4,
            paddingBottom: 2,
          }}
        >
          「{poke.message}」
        </p>
      )}
      {poke.reminderTitle && (
        <p className="rt-h-body mt-1" style={{ fontSize: 13, color: "var(--rt-ink-faint)" }}>
          {poke.groupName ?? "私人"} · {poke.reminderTitle}
        </p>
      )}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {poke.reminderId ? (
          <Link
            href={`/app/reminders/${poke.reminderId}`}
            data-testid="poke-alert-accept"
            className="rt-btn rt-btn-primary"
            style={{ padding: "6px 12px", fontSize: 14 }}
            onClick={onAccept}
          >
            收下，去做
          </Link>
        ) : (
          <button
            type="button"
            data-testid="poke-alert-accept"
            onClick={onAccept}
            disabled={pending}
            className="rt-btn rt-btn-primary"
            style={{ padding: "6px 12px", fontSize: 14 }}
          >
            收下
          </button>
        )}
        <button
          type="button"
          data-testid="poke-alert-later"
          onClick={onLater}
          disabled={pending}
          className="rt-btn rt-btn-ghost"
          style={{ padding: "6px 12px", fontSize: 14 }}
        >
          晚点说
        </button>
      </div>
    </div>
  );
}
