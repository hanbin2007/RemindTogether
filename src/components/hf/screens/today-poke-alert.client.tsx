"use client";

/**
 * 1:1 port of the poke-alert block inside HfToday (design lines 44-61).
 * Inner JSX preserved; we just wire the three buttons to Server
 * Actions.
 */
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { HF } from "@/components/hf";
import {
  acceptPokeAction,
  dismissPokeAction,
} from "@/app/app/(home)/poke-alert-actions";
import type { HfTodayPokeAlert } from "./HfToday";

export function TodayPokeAlert({ alert }: { alert: HfTodayPokeAlert }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onLater = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", alert.id);
    start(async () => {
      await dismissPokeAction(fd);
      router.refresh();
    });
  };

  const onAcceptClick = () => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", alert.id);
    start(async () => {
      await acceptPokeAction(fd);
      router.refresh();
    });
  };

  return (
    <div
      className="hf-box thick tilt-l"
      data-testid="poke-alert"
      style={{
        padding: "10px 12px 12px",
        background: "var(--poke-soft)",
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--poke)" }}>
          <HF.Icon name="wave" size={16} />
        </span>
        <div className="h-meta" style={{ color: "var(--poke)" }}>
          {alert.fromName} 想到你了 · {alert.agoText}
        </div>
      </div>
      <div
        className="h-h3"
        style={{
          marginTop: 0,
          paddingBottom: 2,
          lineHeight: 1.4,
          marginBottom: 2,
          fontFamily: "var(--hand-2)",
        }}
      >
        「{alert.message}」
      </div>
      <div
        className="h-body"
        style={{
          fontSize: 13,
          marginTop: 4,
          color: "var(--ink-faint)",
        }}
      >
        {alert.contextText}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {alert.acceptHref ? (
          <Link
            href={alert.acceptHref}
            onClick={onAcceptClick}
            data-testid="poke-alert-accept"
            className="hf-btn primary"
            style={{ padding: "6px 12px", fontSize: 14 }}
          >
            收下，去做
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAcceptClick}
            disabled={pending}
            data-testid="poke-alert-accept"
            className="hf-btn primary"
            style={{ padding: "6px 12px", fontSize: 14 }}
          >
            收下
          </button>
        )}
        <button
          type="button"
          onClick={onLater}
          disabled={pending}
          data-testid="poke-alert-later"
          className="hf-btn ghost"
          style={{ padding: "6px 12px", fontSize: 14 }}
        >
          晚点说
        </button>
        <Link
          href="#skip-day"
          className="hf-btn ghost"
          style={{
            padding: "6px 12px",
            fontSize: 14,
            marginLeft: "auto",
          }}
          data-testid="poke-alert-skip"
        >
          跳过日
        </Link>
      </div>
    </div>
  );
}
