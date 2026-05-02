"use server";

import { z } from "zod";
import { requestPasswordReset } from "@/services/auth/password-reset";

const schema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email().max(254),
  ),
});

export interface ForgotState {
  ok: boolean;
  message?: string;
}

export async function forgotAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "邮箱格式不对" };
  }
  await requestPasswordReset(parsed.data.email);
  return {
    ok: true,
    message:
      "如果这个邮箱已经注册，我们已经发了重设密码的链接到你邮箱。请注意查收。",
  };
}
