"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth/config";
import {
  EmailAlreadyRegistered,
  createUser,
  signupInputSchema,
} from "@/services/auth/users";
import { consumeInvite } from "@/services/auth/invites";

export type FieldErrors = Partial<Record<string, string>>;
export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
}

const formSchema = signupInputSchema.extend({
  inviteToken: z.string().optional(),
});

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    timezone: String(formData.get("timezone") ?? "") || undefined,
    inviteToken: String(formData.get("inviteToken") ?? "") || undefined,
  };

  const parsed = formSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "请检查表单", fieldErrors };
  }

  let userId: string;
  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      timezone: parsed.data.timezone,
    });
    userId = user.id;
  } catch (e) {
    if (e instanceof EmailAlreadyRegistered) {
      return {
        ok: false,
        message: "这个邮箱已经注册过了",
        fieldErrors: { email: "已被注册，要不直接登录？" },
      };
    }
    throw e;
  }

  // Auto-join the inviting group, if we have a token.
  if (parsed.data.inviteToken) {
    await consumeInvite(parsed.data.inviteToken, userId);
  }

  // Auto-login the new user. signIn() will throw NEXT_REDIRECT on success;
  // we re-throw it so Next.js performs the redirect.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/app",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      // Should not happen — we just created the user — but show a soft
      // landing if it does.
      return { ok: false, message: "注册成功，请前往登录页登录" };
    }
    throw e;
  }
  return { ok: true };
}
