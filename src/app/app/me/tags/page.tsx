import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listTags } from "@/services/tags";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/hf";
import {
  HfL2Tags,
  type HfL2TagsItem,
} from "@/components/hf/screens/HfL2Tags";
import { TagForm } from "./tag-form";
import { deleteTagAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };

  const tags = await listTags(principal);

  // Usage count this week — number of ReminderTag rows whose Reminder
  // has a Completion in the last 7 days for this user. Cheap projection
  // because the result set is small (per-user tag count).
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000);
  const usageRows = await prisma.reminderTag.groupBy({
    by: ["tagId"],
    where: {
      tag: { userId: principal.id },
      reminder: {
        completions: {
          some: { userId: principal.id, completedAt: { gte: weekAgo } },
        },
      },
    },
    _count: { tagId: true },
  });
  const usageMap = new Map(usageRows.map((r) => [r.tagId, r._count.tagId]));

  const items: HfL2TagsItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name.startsWith("#") ? t.name : `#${t.name}`,
    iconName: t.iconName,
    color: t.color,
    usageCount: usageMap.get(t.id) ?? 0,
  }));

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={4}>
      <HfL2Tags
        tags={items}
        createSlot={<TagForm />}
        deleteSlot={(t) => (
          <form action={deleteTagAction} className="leading-none">
            <input type="hidden" name="id" value={t.id} />
            <button
              type="submit"
              data-testid={`tag-${t.id}-delete`}
              aria-label="删除标签"
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "var(--ink-mute)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </form>
        )}
      />
    </PageShell>
  );
}
