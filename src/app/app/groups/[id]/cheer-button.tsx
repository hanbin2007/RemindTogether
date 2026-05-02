"use client";

import { useActionState } from "react";
import { Icon } from "@/components/sketch/icon";
import { cheerUpAction, type CheerState } from "./cheer-actions";

const initial: CheerState = { ok: false };

export function CheerButton({
  groupId,
  toUserId,
  testid,
}: {
  groupId: string;
  toUserId: string;
  testid?: string;
}) {
  const [state, action, pending] = useActionState(cheerUpAction, initial);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="toUserId" value={toUserId} />
      <button
        type="submit"
        disabled={pending || state.ok}
        data-testid={testid ?? "cheer-button"}
        className="rt-btn rt-btn-ghost"
        style={{
          padding: "4px 10px",
          fontSize: 13,
          borderColor: "var(--rt-claim)",
          color: "var(--rt-claim)",
          borderWidth: 1.4,
          borderStyle: "solid",
        }}
      >
        <Icon name="handshake" size={12} />
        {pending ? "搭…" : state.ok ? "送到了 ✓" : "想搭把手"}
      </button>
    </form>
  );
}
