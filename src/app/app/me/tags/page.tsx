import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listTags } from "@/services/tags";
import { AppShell } from "@/components/sketch/app-shell";
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

  return (
    <AppShell
      greeting="我的标签"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="me"
    >
      <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft mb-4">
        给私人提醒分组用，可以是任何分类。
      </p>

      <div className="mb-5">
        <TagForm />
      </div>

      {tags.length === 0 ? (
        <p
          data-testid="tags-empty"
          className="font-[family-name:var(--font-kalam)] text-rt-ink-mute py-6"
        >
          还没有标签 — 上面建一个。
        </p>
      ) : (
        <ul
          className="flex flex-wrap gap-2"
          data-testid="tags-list"
        >
          {tags.map((t, i) => (
            <li
              key={t.id}
              data-testid={`tag-${t.id}`}
              className="rt-rise rt-box-tight px-3 py-1 flex items-center gap-2"
              style={{
                borderRadius: "999px",
                borderColor: t.color,
                borderWidth: "1.6px",
                borderStyle: "solid",
                ["--rt-rise-delay" as never]: `${Math.min(i * 30, 200)}ms`,
              }}
            >
              <span
                className="font-[family-name:var(--font-caveat)] text-base"
                style={{ color: t.color }}
              >
                {t.name}
              </span>
              <form action={deleteTagAction} className="leading-none">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  data-testid={`tag-${t.id}-delete`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute hover:text-[color:var(--rt-poke)]"
                  aria-label="删除标签"
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
