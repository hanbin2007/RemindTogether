/* Custom server entrypoint — handles HTTP, mounts Socket.io, wires the
   PG LISTEN/NOTIFY adapter for cross-process broadcasts, and shuts down
   gracefully on signals. Run via `tsx` so the TS imports under `src/`
   work without a build step. */
import { createServer, type Server as HttpServer } from "node:http";
import next from "next";
import pino from "pino";
import { Server as SocketIOServer } from "socket.io";
import { initSockets } from "./src/lib/socket/init";
import { teardownPubsub } from "./src/lib/socket/pubsub";
import { tickCloseOuts } from "./src/services/streaks";
import { tickReminders } from "./src/services/reminder-cron";

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOST ?? "127.0.0.1";

const log = pino({
  name: "server",
  level: process.env.LOG_LEVEL ?? (dev ? "debug" : "info"),
  ...(dev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
        },
      }
    : {}),
});

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const httpServer = createServer((req, res) => {
      handle(req, res);
    });

    const io = new SocketIOServer(httpServer, {
      path: "/socket.io",
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL ?? "*",
        credentials: true,
      },
    });

    await initSockets(io);

    // Streak close-out tick. Every 30 min we walk all users and lazily
    // close any unclosed days up to (their tz)-yesterday. Idempotent.
    // Single-process safe; in cluster mode multiple workers running this
    // is also fine because StreakDay has unique(userId,date) and races
    // collapse on the unique constraint.
    const TICK_MS = 30 * 60 * 1000;
    let tickTimer: NodeJS.Timeout | null = setInterval(() => {
      tickCloseOuts().catch((err) => {
        log.warn({ err }, "streak tick failed");
      });
    }, TICK_MS);
    if (typeof tickTimer.unref === "function") tickTimer.unref();

    // Reminder due-time tick — every 60s we scan ACTIVE reminders whose
    // dueAt has passed, fire REMINDER_DUE notifications, and roll RRULE
    // reminders forward to their next occurrence.
    const REMINDER_TICK_MS = 60 * 1000;
    let reminderTickTimer: NodeJS.Timeout | null = setInterval(() => {
      tickReminders().catch((err) => {
        log.warn({ err }, "reminder tick failed");
      });
    }, REMINDER_TICK_MS);
    if (typeof reminderTickTimer.unref === "function")
      reminderTickTimer.unref();

    const stopTimers = () => {
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = null;
      if (reminderTickTimer) clearInterval(reminderTickTimer);
      reminderTickTimer = null;
    };
    process.on("SIGTERM", () => {
      stopTimers();
      shutdown("SIGTERM", httpServer, io);
    });
    process.on("SIGINT", () => {
      stopTimers();
      shutdown("SIGINT", httpServer, io);
    });

    httpServer.listen(port, hostname, () => {
      log.info(
        { url: `http://${hostname}:${port}`, dev, pid: process.pid },
        "server ready",
      );
    });
  })
  .catch((err: unknown) => {
    log.error({ err }, "failed to prepare next app");
    process.exit(1);
  });

async function shutdown(
  signal: string,
  httpServer: HttpServer,
  io: SocketIOServer,
) {
  log.info({ signal }, "shutting down");
  io.close();
  await teardownPubsub().catch(() => {});
  httpServer.close((err) => {
    if (err) {
      log.error({ err }, "error during shutdown");
      process.exit(1);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}
