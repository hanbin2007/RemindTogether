"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket/client";
import { useSocketStatus } from "@/hooks/use-socket";

interface EventLine {
  seq: number;
  event: string;
  payload: unknown;
  receivedAt: string;
}

const TRACKED_EVENTS = [
  "reminder:created",
  "reminder:updated",
  "reminder:deleted",
  "reminder:completed",
  "reminder:claimed",
  "reminder:unclaimed",
  "comment:new",
  "reaction:new",
  "poke:received",
  "notification:new",
  "streak:milestone",
  "group:member_joined",
  "group:member_left",
  "group:disbanded",
];

export function RealtimePanel({ userId: _userId }: { userId: string }) {
  const [events, setEvents] = useState<EventLine[]>([]);
  const seq = useRef(0);
  const status = useSocketStatus();

  useEffect(() => {
    const s = getSocket();
    const handlers = TRACKED_EVENTS.map((name) => {
      const fn = (payload: unknown) => {
        seq.current += 1;
        setEvents((prev) =>
          [
            {
              seq: seq.current,
              event: name,
              payload,
              receivedAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 50),
        );
      };
      s.on(name, fn);
      return [name, fn] as const;
    });
    return () => {
      for (const [name, fn] of handlers) s.off(name, fn);
    };
  }, []);

  return (
    <div className="mt-6">
      <div
        data-testid="rt-status"
        data-rt-status={status}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background:
              status === "connected"
                ? "var(--rt-done)"
                : "var(--rt-ink-faint)",
          }}
        />
        {status === "connected" ? "online" : "offline"}
        <span
          data-testid="rt-event-count"
          className="ml-auto text-rt-ink-mute"
        >
          received: {events.length}
        </span>
      </div>

      <ol
        data-testid="rt-feed"
        className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto"
      >
        {events.length === 0 ? (
          <li className="font-[family-name:var(--font-kalam)] text-[14px] text-rt-ink-mute italic">
            还没收到事件 — 试试在另一个浏览器创建群组提醒。
          </li>
        ) : (
          events.map((e) => (
            <li
              key={e.seq}
              data-testid={`rt-row-${e.event}`}
              data-rt-event={e.event}
              className="rt-box-tight bg-rt-paper-2 px-3 py-2 text-[13px]"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] text-rt-ink-mute">
                  #{e.seq}
                </span>
                <span className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[16px]">
                  {e.event}
                </span>
                <span className="ml-auto font-mono text-[10px] text-rt-ink-mute">
                  {e.receivedAt.slice(11, 19)}
                </span>
              </div>
              <pre className="mt-1 font-mono text-[11px] text-rt-ink-soft whitespace-pre-wrap break-words">
                {summarisePayload(e.payload)}
              </pre>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

function summarisePayload(p: unknown): string {
  try {
    const s = JSON.stringify(p, null, 0);
    return s.length > 220 ? s.slice(0, 220) + "…" : s;
  } catch {
    return String(p);
  }
}
