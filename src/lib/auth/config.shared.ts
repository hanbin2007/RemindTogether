/**
 * Shared NextAuth config — used by both Edge middleware and the full
 * Node-runtime auth handler. Anything that imports DB clients, Prisma,
 * or Node-only APIs must live in {@link ./config.ts}, not here.
 */
import type { NextAuthConfig, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      emailIsVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin?: boolean;
    emailIsVerified?: boolean;
  }
}

interface AppJwtClaims {
  isAdmin?: boolean;
  emailIsVerified?: boolean;
}

export const sharedAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  // The credentials provider lives in config.ts (uses DB). Middleware
  // only needs to know the shape; the array is overridden when the full
  // config is built.
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const t = token as typeof token & AppJwtClaims;
        t.sub = user.id;
        t.isAdmin = user.isAdmin ?? false;
        t.emailIsVerified = user.emailIsVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as typeof token & AppJwtClaims;
      session.user.id = t.sub!;
      session.user.isAdmin = t.isAdmin ?? false;
      session.user.emailIsVerified = t.emailIsVerified ?? false;
      return session;
    },
    async authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/app") || path.startsWith("/admin");
      const isAdminOnly = path.startsWith("/admin");
      if (!isProtected) return true;
      if (!session?.user) return false;
      if (isAdminOnly && !session.user.isAdmin) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
