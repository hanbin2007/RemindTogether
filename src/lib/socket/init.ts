import type { Server as IOServer, Socket } from "socket.io";
import pino from "pino";
import { prisma } from "@/lib/prisma";
import { tokenFromHandshake } from "./auth";
import { groupRoom, userRoom } from "./broadcast";
import { setupPubsub } from "./pubsub";

const log = pino({ name: "socket-init", level: process.env.LOG_LEVEL ?? "info" });

declare module "socket.io" {
  interface SocketData {
    userId: string;
    isAdmin: boolean;
  }
}

/**
 * Wire authentication + auto room joins onto the Socket.io server, plus
 * the cross-process LISTEN/NOTIFY adapter. Called from server.js right
 * after `new SocketIOServer(httpServer, {...})`.
 */
export async function initSockets(io: IOServer): Promise<void> {
  io.use(async (socket, next) => {
    try {
      const token = await tokenFromHandshake(socket.handshake.headers);
      if (!token) return next(new Error("unauthorized"));
      socket.data.userId = token.userId;
      socket.data.isAdmin = token.isAdmin;
      next();
    } catch (err) {
      log.warn({ err }, "socket auth failed");
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const { userId } = socket.data;
    socket.join(userRoom(userId));

    // Join every active group the user belongs to. Read-once on connect;
    // joins/leaves during the lifetime of the socket are handled in
    // services that broadcast group:member_joined / group:member_left.
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId, leftAt: null },
        select: { groupId: true },
      });
      for (const m of memberships) {
        socket.join(groupRoom(m.groupId));
      }
      log.debug(
        {
          sid: socket.id,
          userId,
          groups: memberships.length,
        },
        "socket connected",
      );
    } catch (err) {
      log.error({ err, userId }, "failed to load group memberships");
    }

    socket.on("disconnect", (reason) => {
      log.debug({ sid: socket.id, userId, reason }, "socket disconnected");
    });
  });

  await setupPubsub(io);
  log.info("sockets ready");
}
