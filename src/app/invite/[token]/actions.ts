"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { consumeInvite } from "@/services/auth/invites";

export interface JoinState {
  ok: boolean;
  message?: string;
  groupId?: string;
}

export async function joinGroupAction(
  token: string,
  _prev: JoinState,
  _formData: FormData,
): Promise<JoinState> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
  }
  const r = await consumeInvite(token, session.user.id);
  if (!r.ok) {
    return {
      ok: false,
      message:
        r.reason === "expired"
          ? "邀请链接已过期"
          : r.reason === "used"
            ? "邀请链接已被使用"
            : r.reason === "disbanded"
              ? "这个群已经解散"
              : "邀请链接无效",
    };
  }
  return { ok: true, groupId: r.groupId };
}
