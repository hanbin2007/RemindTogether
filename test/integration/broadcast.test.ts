// @vitest-environment node
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { broadcast, groupRoom, RtEvent } from "@/lib/socket/broadcast";
import { setupPubsub, teardownPubsub } from "@/lib/socket/pubsub";

/**
 * End-to-end broadcast test using a real socket.io server + PG NOTIFY.
 * Confirms that calling `broadcast(room, event, payload)` from anywhere
 * (even a different "process" — modeled here as a separate publisher)
 * lands on a connected client whose socket has joined that room.
 */
describe("broadcast → PG NOTIFY → socket.io (integration)", () => {
  let httpServer: HttpServer;
  let io: IOServer;
  let port: number;
  let client: ClientSocket;

  beforeAll(async () => {
    httpServer = new HttpServer();
    io = new IOServer(httpServer, { path: "/socket.io" });
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    port = (httpServer.address() as { port: number }).port;
    await setupPubsub(io);
  });

  afterAll(async () => {
    client?.disconnect();
    io.close();
    await teardownPubsub();
    httpServer.close();
  });

  it("delivers a broadcast to a client in the target room", async () => {
    const ROOM = groupRoom("test-group-1");
    // Server-side: when a client connects, drop them into the room.
    io.on("connection", (socket) => {
      socket.join(ROOM);
    });

    client = ioClient(`http://127.0.0.1:${port}`, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: false,
    });
    await new Promise<void>((resolve, reject) => {
      client.on("connect", resolve);
      client.on("connect_error", reject);
    });

    const received = new Promise<{ payload: unknown }>((resolve) => {
      client.on(RtEvent.ReminderCompleted, (payload: unknown) =>
        resolve({ payload }),
      );
    });
    await broadcast(ROOM, RtEvent.ReminderCompleted, {
      reminderId: "abc",
      by: "user-1",
    });
    const r = await Promise.race([
      received,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      ),
    ]);
    expect((r as { payload: { reminderId: string } }).payload.reminderId).toBe(
      "abc",
    );
  });

  it("does not deliver events to clients in other rooms", async () => {
    // Client connected above is still in "group:test-group-1". Broadcast
    // to a different room — they should NOT receive it.
    let received = false;
    const handler = () => {
      received = true;
    };
    client.on(RtEvent.ReminderCreated, handler);
    await broadcast(
      groupRoom("some-other-group"),
      RtEvent.ReminderCreated,
      { reminderId: "x" },
    );
    // Wait a beat for delivery (or absence)
    await new Promise((r) => setTimeout(r, 500));
    client.off(RtEvent.ReminderCreated, handler);
    expect(received).toBe(false);
  });
});

