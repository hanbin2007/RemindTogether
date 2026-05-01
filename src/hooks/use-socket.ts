"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket/client";

/**
 * Subscribe to a Socket.io event. Handler is called with the payload.
 * The handler reference is captured per-render so callers can pass
 * inline arrow functions without re-subscribing.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    const fn = (payload: T) => handlerRef.current(payload);
    s.on(event, fn);
    return () => {
      s.off(event, fn);
    };
  }, [event]);
}

/** Track whether the socket is currently connected. */
export function useSocketStatus(): "connected" | "disconnected" {
  const [status, setStatus] = useState<"connected" | "disconnected">(
    "disconnected",
  );
  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    if (s.connected) setStatus("connected");
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);
  return status;
}
