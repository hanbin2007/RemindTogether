import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listMyGroups } from "@/services/groups";
import { AppShell } from "@/components/sketch/app-shell";
import { CreateGroupForm } from "./create-group-form";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const groups = await listMyGroups(principal);

  return (
    <AppShell
      greeting="群组"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
    >
      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-5">
        小集体之间互相打气。
      </p>

      <div className="mb-5">
        <CreateGroupForm />
      </div>

      {groups.length === 0 ? (
        <p
          data-testid="groups-empty"
          className="font-[family-name:var(--font-kalam)] text-rt-ink-mute py-6"
        >
          还没加入任何群 — 上面建一个，或者用邀请链接加入朋友的。
        </p>
      ) : (
        <ul className="space-y-2" data-testid="groups-list">
          {groups.map((g, i) => (
            <li
              key={g.id}
              data-testid={`groups-row-${g.id}`}
              className="rt-rise rt-box-tight bg-rt-paper px-4 py-3"
              style={{
                borderRadius: "10px 6px 11px 5px / 5px 11px 6px 10px",
                ["--rt-rise-delay" as never]: `${Math.min(i * 50, 250)}ms`,
              }}
            >
              <Link
                href={`/app/groups/${g.id}`}
                className="block flex items-baseline gap-2"
              >
                <span className="text-2xl leading-none">
                  {g.coverEmoji ?? "📌"}
                </span>
                <span className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-xl">
                  {g.name}
                </span>
                <span className="ml-auto rt-squig text-rt-ink-soft text-sm">
                  进入 →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
