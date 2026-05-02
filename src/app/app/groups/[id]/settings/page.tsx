/**
 * Server-side data fetch + thin wrapper around `<HfL2GroupSettings />`.
 * The visual port lives in `components/hf/screens/HfL2GroupSettings.tsx`;
 * this page just gathers the data and plugs the rules-toggle / rename
 * client components into the slot props.
 */
import "@/app/hifi-sketch.css";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getGroup } from "@/services/groups";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { avatarSlot } from "@/components/sketch/avatar";
import {
  HfL2GroupSettings,
  type HfL2GroupSettingsMember,
} from "@/components/hf/screens/HfL2GroupSettings";
import { GroupRulesToggles } from "./rules-toggles";
import { RenameButton } from "./rename-button";

export const dynamic = "force-dynamic";

export default async function GroupSettingsPage({
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
  let detail;
  try {
    detail = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }
  const isOwner = detail.ownerId === session.user.id;

  const memberRows = await prisma.groupMember.findMany({
    where: { groupId: id, leftAt: null },
    include: { user: { select: { id: true, displayName: true } } },
    orderBy: { joinedAt: "asc" },
    take: 50,
  });

  const members: HfL2GroupSettingsMember[] = memberRows.map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    role: m.role,
    slot: avatarSlot(m.userId),
  }));

  const daysSinceCreated = Math.max(
    1,
    Math.floor((Date.now() - detail.createdAt.getTime()) / 86_400_000),
  );

  return (
    <HfL2GroupSettings
      groupId={detail.id}
      name={detail.name}
      coverEmoji={detail.coverEmoji ?? null}
      memberCount={detail.memberCount}
      daysSinceCreated={daysSinceCreated}
      members={members}
      isOwner={isOwner}
      backHref={`/app/groups/${id}`}
      inviteHref={`/app/groups/${detail.id}/invite`}
      rulesSlot={<GroupRulesToggles groupId={detail.id} canEdit={isOwner} />}
      renameSlot={
        isOwner ? (
          <RenameButton groupId={detail.id} currentName={detail.name} />
        ) : undefined
      }
      disbandAction={`/app/groups/${detail.id}/disband`}
      leaveAction={`/api/groups/${detail.id}/leave`}
    />
  );
}
