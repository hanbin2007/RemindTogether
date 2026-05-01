import { Client } from "pg";
import pino from "pino";
import type { Server as IOServer } from "socket.io";

const log = pino({ name: "socket-pubsub", level: process.env.LOG_LEVEL ?? "info" });

const CHANNEL = "rt_socket";

interface BroadcastFrame {
  room: string;
  event: string;
  payload: unknown;
}

let pubClient: Client | null = null;
let subClient: Client | null = null;

async function newConnectedClient(): Promise<Client> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for socket pubsub");
  // Strip Prisma-only `?schema=public` so node-pg doesn't choke.
  const parsed = new URL(url);
  parsed.searchParams.delete("schema");
  const c = new Client({ connectionString: parsed.toString() });
  await c.connect();
  return c;
}

/**
 * Wire the local Socket.io server to a PG `LISTEN rt_socket` channel.
 * Whenever ANY worker (including this one) calls {@link broadcast}, every
 * subscriber re-emits the event into its in-process io. Single-process
 * setups still work — the publish/subscribe loop just makes a round trip.
 */
export async function setupPubsub(io: IOServer): Promise<void> {
  if (subClient) return;
  subClient = await newConnectedClient();
  await subClient.query(`LISTEN ${CHANNEL}`);
  subClient.on("notification", (msg) => {
    if (msg.channel !== CHANNEL || !msg.payload) return;
    try {
      const frame = JSON.parse(msg.payload) as BroadcastFrame;
      io.to(frame.room).emit(frame.event, frame.payload);
    } catch (err) {
      log.warn({ err }, "bad pubsub payload");
    }
  });
  subClient.on("error", (err) => {
    log.error({ err }, "pg pubsub subscriber errored");
  });
  log.info("pg pubsub subscriber ready");
}

/**
 * Publish a broadcast frame to every Node worker subscribed to the
 * `rt_socket` channel (which includes the current worker, so callers
 * never need to also call `io.to(...).emit(...)` themselves).
 */
export async function publish(frame: BroadcastFrame): Promise<void> {
  if (!pubClient) {
    pubClient = await newConnectedClient();
    pubClient.on("error", (err) => {
      log.error({ err }, "pg pubsub publisher errored");
      pubClient = null;
    });
  }
  await pubClient.query("SELECT pg_notify($1, $2)", [
    CHANNEL,
    JSON.stringify(frame),
  ]);
}

/**
 * Tear down the pubsub clients (used in tests so the process can exit
 * cleanly between specs).
 */
export async function teardownPubsub(): Promise<void> {
  if (subClient) {
    try {
      await subClient.query(`UNLISTEN ${CHANNEL}`);
    } catch {
      /* ignore */
    }
    await subClient.end();
    subClient = null;
  }
  if (pubClient) {
    await pubClient.end();
    pubClient = null;
  }
}
