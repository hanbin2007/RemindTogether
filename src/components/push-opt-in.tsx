"use client";

import { useEffect, useState } from "react";

interface Props {
  vapidPublicKey: string | null;
}

type Stage =
  | "unsupported"
  | "no-key"
  | "denied"
  | "default"
  | "registering"
  | "subscribed"
  | "error";

/**
 * One-button Web Push opt-in. Registers /sw.js on first interaction so
 * we don't run the SW for every visitor — only those who actually want
 * notifications. Idempotent: once subscribed, subsequent renders just
 * show the "已开启" state.
 */
export function PushOptIn({ vapidPublicKey }: Props) {
  const [stage, setStage] = useState<Stage>("default");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStage("unsupported");
      return;
    }
    if (!vapidPublicKey) {
      setStage("no-key");
      return;
    }
    if (Notification.permission === "denied") {
      setStage("denied");
      return;
    }
    // If a SW is already controlling the page and we have a sub, mark subscribed
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setStage("subscribed");
    });
  }, [vapidPublicKey]);

  async function enable() {
    setStage("registering");
    setErrMsg(null);
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStage(permission === "denied" ? "denied" : "default");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey ?? ""),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        throw new Error(`server rejected: ${res.status}`);
      }
      setStage("subscribed");
    } catch (e) {
      setStage("error");
      setErrMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function disable() {
    setStage("registering");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setStage("default");
    } catch {
      setStage("error");
    }
  }

  if (stage === "unsupported") {
    return (
      <p
        data-testid="push-unsupported"
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-rt-ink-mute"
      >
        浏览器不支持 push（试 chrome / firefox / iOS 16.4+ 主屏 app）
      </p>
    );
  }
  if (stage === "no-key") {
    return (
      <p
        data-testid="push-no-key"
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-rt-ink-mute"
      >
        push 暂未配置（缺 VAPID 公钥）
      </p>
    );
  }
  if (stage === "subscribed") {
    return (
      <button
        type="button"
        onClick={disable}
        data-testid="push-disable"
        className="rt-btn"
      >
        已开启 push · 点击关闭
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={enable}
        disabled={stage === "registering" || stage === "denied"}
        data-testid="push-enable"
        className="rt-btn rt-btn-primary"
      >
        {stage === "registering"
          ? "申请中…"
          : stage === "denied"
            ? "权限被拒，请到浏览器设置开启"
            : "开启 push 通知"}
      </button>
      {errMsg && (
        <span
          data-testid="push-error"
          className="font-mono text-[11px] text-[color:var(--rt-poke)]"
        >
          {errMsg}
        </span>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  // Allocate a fresh ArrayBuffer (not SharedArrayBuffer) so the result
  // satisfies BufferSource for pushManager.subscribe under TS strict.
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}
