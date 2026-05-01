"use server";

import { resetPasswordSchema, consumePasswordReset } from "@/services/auth/password-reset";

export interface ResetState {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

export async function resetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: ResetState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0]?.toString();
      if (k) fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "请检查表单", fieldErrors };
  }
  const r = await consumePasswordReset(parsed.data.token, parsed.data.newPassword);
  if (!r.ok) {
    return {
      ok: false,
      message:
        r.reason === "expired"
          ? "链接已过期，请重新申请"
          : r.reason === "used"
            ? "这个链接已经用过了"
            : "链接无效",
    };
  }
  return {
    ok: true,
    message: "密码已重设，去登录吧。",
  };
}
