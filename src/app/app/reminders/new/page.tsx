import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { CreateReminderForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const sp = await searchParams;
  const groupId = sp.groupId;

  const groups = await prisma.group.findMany({
    where: {
      isDisbanded: false,
      members: { some: { userId: principal.id, leftAt: null } },
    },
    select: { id: true, name: true, coverEmoji: true },
    orderBy: { createdAt: "asc" },
  });

  // Members of the initial group (for the @ assignee picker). Empty
  // when no group preselected.
  const initialMembers = groupId
    ? await prisma.groupMember.findMany({
        where: { groupId, leftAt: null },
        include: { user: { select: { id: true, displayName: true } } },
        take: 50,
      }).then((rows) =>
        rows
          .filter((m) => m.userId !== principal.id)
          .map((m) => ({
            userId: m.userId,
            displayName: m.user.displayName,
          })),
      )
    : [];

  return (
    // The design draws HfCreate as a modal over a dimmed today list. On
    // web we render it as a dedicated page — same sheet-styled card,
    // standalone chrome.
    <div
      className="hf min-h-screen"
      style={{
        background: "var(--paper)",
        maxWidth: "36rem",
        margin: "0 auto",
        padding: "12px 8px 56px",
      }}
    >
      <Link
        href={groupId ? `/app/groups/${groupId}` : "/app"}
        className="hf-btn ghost"
        style={{ padding: "4px 8px", fontSize: 14, marginBottom: 8 }}
        aria-label="返回"
        data-testid="newreminder-back"
      >
        ‹
      </Link>
      <CreateReminderForm
        groups={groups}
        initialGroupId={groupId ?? null}
        initialMembers={initialMembers}
      />
    </div>
  );
}
