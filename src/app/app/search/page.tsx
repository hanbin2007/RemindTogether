import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { globalSearch } from "@/services/search";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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
  const q = sp.q ?? "";
  const hits = q ? await globalSearch(principal, q) : [];

  return (
    <AppShell
      meta={null}
      greeting={undefined}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="other"
    >
      <form
        action="/app/search"
        method="get"
        className="rt-box flex items-center gap-2 px-3 py-1.5"
        data-testid="search-form"
      >
        <Link
          href="/app"
          className="rt-h-meta"
          aria-label="返回"
          style={{ fontSize: 18 }}
        >
          ‹
        </Link>
        <Icon name="search" size={14} />
        <input
          name="q"
          defaultValue={q}
          placeholder="找提醒、群、朋友"
          autoFocus
          data-testid="search-input"
          className="flex-1 bg-transparent outline-none rt-h-row"
          style={{ fontSize: 16 }}
        />
        {q && (
          <Link
            href="/app/search"
            data-testid="search-clear"
            aria-label="清空"
          >
            <Icon name="x" size={12} color="var(--rt-ink-faint)" />
          </Link>
        )}
      </form>

      {q && hits.length === 0 && (
        <div
          data-testid="search-empty"
          className="text-center py-12 px-4"
        >
          <div
            className="rt-box rt-box-dashed mx-auto flex items-center justify-center"
            style={{
              width: 84,
              height: 84,
              background: "var(--rt-paper-2)",
            }}
          >
            <Icon name="search" size={42} color="var(--rt-ink-faint)" />
          </div>
          <p className="rt-h-h3 mt-3">没找到「{q}」</p>
          <p className="rt-h-body mt-1 text-rt-ink-mute">
            换个关键字试试 — 或者直接 + 一个新提醒。
          </p>
        </div>
      )}

      {hits.length > 0 && (
        <ul className="rt-box mt-3 px-3" data-testid="search-results">
          {hits.map((h, i) => (
            <li
              key={`${h.kind}-${h.id}`}
              data-testid={`search-result-${h.kind}-${h.id}`}
              className="rt-row"
              style={{
                borderBottom:
                  i === hits.length - 1 ? "none" : undefined,
              }}
            >
              <span className="inline-flex flex-shrink-0">
                <Icon
                  name={
                    h.kind === "reminder"
                      ? "check"
                      : h.kind === "group"
                        ? "users"
                        : "smile"
                  }
                  size={14}
                />
              </span>
              <Link href={h.href} className="flex-1 min-w-0 block">
                <p className="rt-h-row truncate">{h.title}</p>
                {h.sub && <p className="rt-h-meta">{h.sub}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
