"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { dismissReport, resolveReport } from "@/services/admin/reports";

const schema = z.object({
  reportId: z.string().uuid(),
  note: z.string().optional(),
});

export async function resolveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = schema.parse({
    reportId: formData.get("reportId"),
    note: (formData.get("note") as string | null) ?? undefined,
  });
  await resolveReport(admin, parsed.reportId, parsed.note);
  revalidatePath(`/admin/reports/${parsed.reportId}`);
  revalidatePath("/admin/reports");
}

export async function dismissAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = schema.parse({
    reportId: formData.get("reportId"),
    note: (formData.get("note") as string | null) ?? undefined,
  });
  await dismissReport(admin, parsed.reportId, parsed.note);
  revalidatePath(`/admin/reports/${parsed.reportId}`);
  revalidatePath("/admin/reports");
}
