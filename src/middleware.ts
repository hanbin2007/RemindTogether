/**
 * Edge-safe middleware. Imports the shared config (no DB/Node deps) so it
 * can run in the Edge runtime. The full auth config — used by the API
 * route, server actions, and server components — lives in
 * src/lib/auth/config.ts and uses Prisma.
 */
import NextAuth from "next-auth";
import { sharedAuthConfig } from "@/lib/auth/config.shared";

const { auth } = NextAuth(sharedAuthConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Run middleware on every page route except:
     * - Next.js internals (_next/*)
     * - Auth handler endpoints (/api/auth/*)
     * - Public assets (favicon, public/*)
     * - Static files (anything with a dot, e.g. .svg, .png, .ico)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
