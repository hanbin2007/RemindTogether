import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  subscribe,
  subscribeInputSchema,
  unsubscribe,
  unsubscribeInputSchema,
} from "@/services/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Register (or refresh) a Web Push subscription for the current user.
 * Idempotent on `endpoint` so repeated SW activations don't pile up
 * duplicate rows.
 */
export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = subscribeInputSchema.parse(await req.json());
    const data = await subscribe(principal, body);
    return NextResponse.json(
      { data: { id: data.id, endpoint: data.endpoint } },
      { status: 201 },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * Drop a subscription. Used when the browser unregisters its SW or the
 * user opts out via the UI.
 */
export async function DELETE(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = unsubscribeInputSchema.parse(await req.json());
    const data = await unsubscribe(principal, body);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
