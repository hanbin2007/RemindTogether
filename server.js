/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const { Server: SocketIOServer } = require("socket.io");
const next = require("next");
const pino = require("pino");

const dev = process.env.NODE_ENV !== "production";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "127.0.0.1";

const log = pino({
  name: "server",
  level: process.env.LOG_LEVEL || (dev ? "debug" : "info"),
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
  .then(() => {
    const httpServer = createServer((req, res) => {
      // Let Next.js handle every non-socket.io request.
      handle(req, res);
    });

    const io = new SocketIOServer(httpServer, {
      path: "/socket.io",
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || "*",
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      log.info({ id: socket.id }, "socket connected");
      socket.on("disconnect", (reason) => {
        log.info({ id: socket.id, reason }, "socket disconnected");
      });
    });

    // Expose io for graceful shutdown / future test hooks.
    process.on("SIGTERM", () => shutdown("SIGTERM", httpServer, io));
    process.on("SIGINT", () => shutdown("SIGINT", httpServer, io));

    httpServer.listen(port, hostname, () => {
      log.info(
        { url: `http://${hostname}:${port}`, dev, pid: process.pid },
        "server ready",
      );
    });
  })
  .catch((err) => {
    log.error({ err }, "failed to prepare next app");
    process.exit(1);
  });

function shutdown(signal, httpServer, io) {
  log.info({ signal }, "shutting down");
  io.close();
  httpServer.close((err) => {
    if (err) {
      log.error({ err }, "error during shutdown");
      process.exit(1);
    }
    process.exit(0);
  });
  // Hard timeout in case sockets hang.
  setTimeout(() => process.exit(1), 8000).unref();
}
