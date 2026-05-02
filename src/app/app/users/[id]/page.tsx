import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getPublicProfile } from "@/services/profile";
import { NotFoundError } from "@/lib/api/errors";
import { avatarSlot } from "@/components/sketch/avatar";
import { PageShell, HF } from "@/components/hf";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
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

  if (id === session.user.id) {
    redirect("/app/me");
  }

  let profile;
  try {
    profile = await getPublicProfile(principal, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const slot = avatarSlot(profile.userId);

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={3}>
      <div
        data-testid="user-profile-page"
        className="hf"
        style={{
          background: "var(--paper)",
          width: "100%",
          maxWidth: "var(--app-max-w)",
          margin: "0 auto",
          minHeight: "100vh",
          padding: "20px 18px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 6,
          }}
        >
          <HF.Av name={profile.displayName} i={slot} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              data-testid="user-profile-name"
              className="h-display"
              style={{ fontSize: 28, lineHeight: 1.1 }}
            >
              {profile.displayName}
            </div>
            <div className="h-meta" style={{ marginTop: 4 }}>
              共同 {profile.sharedGroups.length} 个群 · 本周完成{" "}
              <span data-testid="user-profile-week-count">
                {profile.weeklyCompletionsInShared}
              </span>{" "}
              件
            </div>
          </div>
        </div>

        {profile.sharedGroups.length > 0 ? (
          <>
            <div className="h-meta" style={{ marginTop: 22 }}>
              共同的小群
            </div>
            <div
              data-testid="user-profile-groups"
              className="hf-box"
              style={{ marginTop: 6, padding: "4px 12px" }}
            >
              {profile.sharedGroups.map((g, i, a) => (
                <Link
                  key={g.id}
                  href={`/app/groups/${g.id}`}
                  data-testid={`user-profile-group-${g.id}`}
                  className="hf-row"
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      i === a.length - 1
                        ? "none"
                        : "1.3px dashed var(--ink-faint)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{g.coverEmoji ?? "📌"}</span>
                  <span style={{ flex: 1 }}>{g.name}</span>
                  <span className="hf-arrow" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div
            className="hf-box dashed"
            data-testid="user-profile-empty"
            style={{ marginTop: 20, padding: 14, textAlign: "center" }}
          >
            <div className="h-body">还没共同的群。</div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
