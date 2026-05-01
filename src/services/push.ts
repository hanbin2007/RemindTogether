/* eslint-disable @typescript-eslint/no-explicit-any */
import webpush, {
  type PushSubscription as VapidSubscription,
  type WebPushError,
} from "web-push";
import { Prisma, type PushSubscription } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import pino from "pino";

const log = pino({ name: "push", level: process.env.LOG_LEVEL ?? "info" });

// -----------------------------------------------------------------------------
// VAPID setup (idempotent — supports tests calling configure() with stubs)
// -----------------------------------------------------------------------------

let configured = false;
function configure(): void {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    log.warn(
      "VAPID keys not configured — sendPush will be a no-op (set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)",
    );
    return;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured(): boolean {
  configure();
  return configured;
}

// -----------------------------------------------------------------------------
// schemas
// -----------------------------------------------------------------------------

export const subscribeInputSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
  userAgent: z.string().max(200).optional(),
});
export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

export const unsubscribeInputSchema = z.object({
  endpoint: z.string().url().max(2000),
});
export type UnsubscribeInput = z.infer<typeof unsubscribeInputSchema>;

// -----------------------------------------------------------------------------
// subscribe / unsubscribe
// -----------------------------------------------------------------------------

export async function subscribe(
  principal: Principal,
  raw: SubscribeInput,
): Promise<PushSubscription> {
  const input = subscribeInputSchema.parse(raw);
  // Idempotent: same endpoint reused → swap to current user.
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: principal.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId: principal.id,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function unsubscribe(
  principal: Principal,
  raw: UnsubscribeInput,
): Promise<{ removed: number }> {
  const input = unsubscribeInputSchema.parse(raw);
  const r = await prisma.pushSubscription.deleteMany({
    where: { endpoint: input.endpoint, userId: principal.id },
  });
  return { removed: r.count };
}

// -----------------------------------------------------------------------------
// sendPush
// -----------------------------------------------------------------------------

export interface PushPayload {
  /** Notification title (shows in OS notification chrome) */
  title: string;
  /** Body text */
  body: string;
  /** Optional URL to open on click; defaults to /app */
  url?: string;
  /** Optional data passed to the SW notificationclick handler */
  data?: Record<string, unknown>;
  /** Optional unique tag — same tag replaces previous notification */
  tag?: string;
}

/**
 * Fan-out a payload to every active push subscription for `userId`. Errors
 * are logged but never thrown — push is best-effort. Subscriptions that
 * return 404/410 (Gone) are pruned automatically.
 */
export async function sendPush(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; pruned: number }> {
  configure();
  if (!configured) return { sent: 0, pruned: 0 };

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (subs.length === 0) return { sent: 0, pruned: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/app",
    tag: payload.tag,
    data: payload.data ?? {},
  });

  let sent = 0;
  let pruned = 0;
  for (const sub of subs) {
    const target: VapidSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(target, body);
      sent++;
    } catch (err) {
      const status = (err as WebPushError | undefined)?.statusCode;
      if (status === 404 || status === 410) {
        // Endpoint Gone — drop it.
        try {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          pruned++;
        } catch (delErr) {
          if (
            !(
              delErr instanceof Prisma.PrismaClientKnownRequestError &&
              delErr.code === "P2025"
            )
          ) {
            log.warn(
              { err: delErr, subId: sub.id },
              "failed to prune dead subscription",
            );
          }
        }
      } else {
        log.warn(
          { err, status, subId: sub.id },
          "web-push send failed (kept subscription)",
        );
      }
    }
  }
  return { sent, pruned };
}

// -----------------------------------------------------------------------------
// test seam: swap the underlying webpush.sendNotification with a mock
// -----------------------------------------------------------------------------

let originalSend: typeof webpush.sendNotification | null = null;

export function __mockWebPush(
  fn: (sub: VapidSubscription, body?: string) => Promise<unknown>,
): void {
  if (!originalSend) originalSend = webpush.sendNotification.bind(webpush);
  // @ts-expect-error — overriding at runtime for tests
  webpush.sendNotification = fn;
  configured = true; // bypass env check
}

export function __restoreWebPush(): void {
  if (originalSend) {
    webpush.sendNotification = originalSend;
    originalSend = null;
  }
}
