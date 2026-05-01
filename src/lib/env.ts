/**
 * Centralised env access. Anything that reads `process.env` outside this
 * file should be considered a code smell.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  /** Base URL of the public site, used to build email links. */
  baseUrl: optional("NEXT_PUBLIC_BASE_URL", "http://127.0.0.1:3000"),
  /** Auth.js JWT signing secret. Must be set in production. */
  authSecret: () => required("AUTH_SECRET"),
  /** Database connection string. */
  databaseUrl: () => required("DATABASE_URL"),
  /** Logger level — debug in dev, info in prod (overridable). */
  logLevel: optional(
    "LOG_LEVEL",
    process.env.NODE_ENV === "production" ? "info" : "debug",
  ),
  /** True in production deploys. */
  isProd: process.env.NODE_ENV === "production",
};
