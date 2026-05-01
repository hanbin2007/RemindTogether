import { publish } from "./pubsub";

/**
 * Realtime event names used across the app — listed once here so a typo
 * in a service caller fails type checking instead of silently dropping
 * the broadcast on the floor.
 *
 * These mirror docs/05-REALTIME-EVENTS.md.
 */
export const RtEvent = {
  ReminderCreated: "reminder:created",
  ReminderUpdated: "reminder:updated",
  ReminderDeleted: "reminder:deleted",
  ReminderCompleted: "reminder:completed",
  ReminderClaimed: "reminder:claimed",
  ReminderUnclaimed: "reminder:unclaimed",
  CommentNew: "comment:new",
  ReactionNew: "reaction:new",
  PokeReceived: "poke:received",
  NotificationNew: "notification:new",
  StreakMilestone: "streak:milestone",
  GroupMemberJoined: "group:member_joined",
  GroupMemberLeft: "group:member_left",
  GroupDisbanded: "group:disbanded",
} as const;
export type RtEvent = (typeof RtEvent)[keyof typeof RtEvent];

/** Build a room name targeting a specific user. */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

/** Build a room name targeting every member of a group. */
export function groupRoom(groupId: string): string {
  return `group:${groupId}`;
}

/**
 * Send `event` with `payload` into `room`. Fire-and-forget by default
 * (we don't want a pubsub hiccup to fail a user-visible mutation), but
 * callers can `await` if they need delivery confirmation in tests.
 */
export async function broadcast(
  room: string,
  event: RtEvent,
  payload: unknown,
): Promise<void> {
  try {
    await publish({ room, event, payload });
  } catch (err) {
    // Eat the error — realtime is a best-effort channel; the canonical
    // state lives in PG and clients can recover via REST.
    // eslint-disable-next-line no-console
    console.warn("broadcast failed", { room, event, err });
  }
}
