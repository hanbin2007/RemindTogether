import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getGroup } from "@/services/groups";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { env } from "@/lib/env";
import { PageShell } from "@/components/hf";
import { HfInvite } from "@/components/hf/screens/HfInvite";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const { id } = await params;
  let group;
  try {
    group = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  // Look for an outstanding (un-used, non-expired) invite token issued by
  // this user for this group; reuse it so reloads don't keep creating new
  // tokens. If none exist, leave inviteUrl null so the "生成" button
  // renders.
  const existing = await prisma.inviteToken.findFirst({
    where: {
      groupId: id,
      createdById: session.user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  const inviteUrl = existing
    ? `${env.baseUrl.replace(/\/$/, "")}/invite/${existing.token}`
    : null;

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={1}>
      <HfInvite
        groupId={group.id}
        groupName={group.name}
        memberCount={group.memberCount}
        inviteUrl={inviteUrl}
      />
    </PageShell>
  );
}
