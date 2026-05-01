import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  testid: string;
  active?: boolean;
}

/**
 * Shared chrome around every signed-in /app/* page. Mobile-first single
 * column with a sticky bottom nav (5 slots). Admin link is rendered only
 * when the principal is admin (passed in by the page that resolved the
 * session).
 */
export function AppShell({
  greeting,
  email,
  isAdmin,
  current,
  children,
}: {
  greeting: string;
  email: string;
  isAdmin: boolean;
  current: "today" | "private" | "groups" | "me" | "other";
  children: React.ReactNode;
}) {
  const items: NavItem[] = [
    { href: "/app", label: "今日", testid: "nav-today", active: current === "today" },
    {
      href: "/app/private",
      label: "私人",
      testid: "nav-private",
      active: current === "private",
    },
    { href: "/app/groups", label: "群组", testid: "nav-groups", active: current === "groups" },
    { href: "/app/me", label: "我", testid: "nav-me", active: current === "me" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-6 pb-2 flex items-center gap-3">
        <Link
          href="/"
          className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute hover:text-rt-ink"
        >
          REMIND · TOGETHER
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            data-testid="link-admin"
            className="ml-auto rt-squig text-rt-ink text-sm"
          >
            管理后台 →
          </Link>
        )}
      </header>
      <main className="flex-1 px-5 pb-24 max-w-xl w-full mx-auto" data-testid="app-shell">
        <div className="mt-2 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rt-ink-mute">
            {email}
          </p>
          <h1
            data-testid="app-greeting"
            className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[36px] leading-tight"
          >
            {greeting}
          </h1>
        </div>
        {children}
      </main>
      <nav
        data-testid="app-nav"
        className="fixed bottom-0 inset-x-0 border-t border-rt-ink-faint bg-[color:var(--rt-paper)] backdrop-blur-sm px-2 py-1.5"
      >
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testid}
              data-active={item.active ? "true" : undefined}
              className={`text-center py-2 font-[family-name:var(--font-caveat)] font-semibold text-base transition-colors ${
                item.active
                  ? "text-rt-ink"
                  : "text-rt-ink-mute hover:text-rt-ink"
              }`}
            >
              <span className={item.active ? "rt-squig pb-0.5" : ""}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
