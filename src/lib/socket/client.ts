"use client";

import { io, type Socket } from "socket.io-client";

let cached: Socket | null = null;

/**
 * Browser-side singleton Socket.io client. Same-origin connection so the
 * NextAuth session cookie is sent automatically (HttpOnly + same site).
 *
 * The first call lazily opens the WebSocket; subsequent calls reuse it.
 * We don't `disconnect()` on unmount — the connection stays alive across
 * page navigations within the SPA.
 */
export function getSocket(): Socket {
  if (cached) return cached;
  cached = io({
    path: "/socket.io",
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
  });
  return cached;
}

/** Test-only — break the singleton so the next getSocket() reconnects. */
export function __resetSocket(): void {
  cached?.disconnect();
  cached = null;
}
