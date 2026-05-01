import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";
import { CreateGroupForm } from "../create-group-form";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return (
    <AppShell
      meta="只是几个朋友互相打气"
      greeting="新建群"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
    >
      <Link
        href="/app/groups"
        className="rt-h-meta inline-flex items-center gap-1 mb-4"
      >
        ‹ 群组列表
      </Link>

      <div
        className="rt-box p-4 mb-4"
        style={{ background: "var(--rt-paper-2)" }}
      >
        <p className="rt-h-body" style={{ fontSize: 14 }}>
          一个群里可以一起记事、一起完成。<span className="rt-hl">建群之后</span>
          再发邀请链接。
        </p>
      </div>

      <CreateGroupForm />

      <div className="mt-6 flex items-center gap-2">
        <span className="inline-flex rt-text-mute">
          <Icon name="users" size={14} />
        </span>
        <p className="rt-h-meta">建群后默认你是群主</p>
      </div>
    </AppShell>
  );
}
