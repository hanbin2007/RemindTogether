"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth/config";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  redirectTo: z.string().optional(),
});

export interface LoginState {
  ok: boolean;
  message?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "请填写邮箱和密码" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.redirectTo || "/app",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return { ok: false, message: "邮箱或密码不对" };
      }
      return { ok: false, message: "登录失败，请稍后再试" };
    }
    throw e;
  }
  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/");
}
