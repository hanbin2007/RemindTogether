/**
 * Full NextAuth config — uses Prisma and other Node-only deps. Use this
 * in API routes, server actions, server components, and tests. The
 * Edge-safe subset lives in {@link ./config.shared.ts} and is what the
 * middleware imports.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sharedAuthConfig } from "./config.shared";
import {
  credentialsInputSchema,
  verifyCredentials,
} from "@/services/auth/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...sharedAuthConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsInputSchema.safeParse(raw);
        if (!parsed.success) return null;
        const principal = await verifyCredentials(parsed.data);
        if (!principal) return null;
        return {
          id: principal.id,
          email: principal.email,
          name: principal.displayName,
          isAdmin: principal.isAdmin,
          emailIsVerified: !!principal.emailVerifiedAt,
        };
      },
    }),
  ],
});
