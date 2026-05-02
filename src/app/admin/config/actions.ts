"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { adminSetConfig } from "@/services/admin/config";

const schema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function setConfigAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = schema.parse({
    key: formData.get("key"),
    value: formData.get("value"),
  });
  await adminSetConfig(admin, parsed.key, parsed.value);
  revalidatePath("/admin/config");
}
