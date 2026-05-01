import { NextResponse } from "next/server";
import { ZodError } from "zod";
import pino from "pino";
import { HttpError } from "./errors";

const log = pino({ name: "api", level: process.env.LOG_LEVEL ?? "info" });

/**
 * Convert anything thrown out of a service / route handler into a
 * structured JSON response. Validation failures become 422 with the
 * zod issue tree; known HttpError subclasses keep their status; anything
 * else is logged and turned into an opaque 500 (so internal errors don't
 * leak to clients).
 */
export function handleApiError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        error: "validation",
        issues: e.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
      { status: 422 },
    );
  }
  if (e instanceof HttpError) {
    return NextResponse.json(
      { error: e.code, message: e.message },
      { status: e.status },
    );
  }
  log.error({ err: e }, "unhandled api error");
  return NextResponse.json({ error: "internal" }, { status: 500 });
}
