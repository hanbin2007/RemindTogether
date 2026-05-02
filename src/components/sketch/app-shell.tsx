import Link from "next/link";
import { Icon, type IconName } from "./icon";

interface NavItem {
  href: string;
  label: string;
  testid: string;
  icon: IconName;
  active?: boolean;
  variant?: "poke";
}

/**
 * Shared chrome around every signed-in /app/* page. Mobile-first single
 * column with a sticky bottom nav (5 slots: 今天 / 群组 / 拍拍 / 私人 /
 * 我). Center "拍拍" is a soft poke launcher pointing to /app/me/notifications
 * — opens recent inbox where the user can also tap "拍回去". Admin link
 * is only rendered when the principal is admin.
 *
 * Layout mirrors design/project/hf-shared.jsx (Phone + TabBar) without the
 * phone bezels, so it works across mobile and desktop with a comfortable
 * max-width.
 */
export function AppShell({
  greeting,
  email,
  isAdmin,
  current,
  meta,
  trailing,
  children,
}: {
  greeting?: React.ReactNode;
  email: string;
  isAdmin: boolean;
  current:
    | "today"
    | "private"
    | "groups"
    | "poke"
    | "me"
    | "other";
  /** Optional meta line shown above the greeting (e.g. "星期四 · 4 月 30 日"). */
  meta?: React.ReactNode;
  /** Optional element on the top-right of the page header (e.g. avatar). */
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const items: NavItem[] = [
    {
      href: "/app",
      label: "今天",
      testid: "nav-today",
      icon: "home",
      active: current === "today",
    },
    {
      href: "/app/groups",
      label: "群组",
      testid: "nav-groups",
      icon: "users",
      active: current === "groups",
    },
    {
      href: "/app/me/notifications",
      label: "拍拍",
      testid: "nav-poke",
      // Outline bolt; the center tab fills it in poke red when active —
      // matches design/project/hf-shared.jsx TabBar slot 2.
      icon: "bolt",
      active: current === "poke",
      variant: "poke",
    },
    {
      href: "/app/private",
      label: "私人",
      testid: "nav-private",
      icon: "menu",
      active: current === "private",
    },
    {
      href: "/app/me",
      label: "我",
      testid: "nav-me",
      icon: "person",
      active: current === "me",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 pt-5 pb-1 flex items-center gap-3 max-w-xl w-full mx-auto">
        <Link
          href="/"
          className="rt-h-meta hover:text-rt-ink"
          style={{ letterSpacing: "0.18em" }}
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
      <main
        className="flex-1 px-5 pb-24 max-w-xl w-full mx-auto"
        data-testid="app-shell"
      >
        {(greeting || trailing || email) && (
          <div className="mt-2 mb-5">
            {meta && <div className="rt-h-meta">{meta}</div>}
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="min-w-0">
                {!meta && email && (
                  <p
                    className="rt-h-meta"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {email}
                  </p>
                )}
                {greeting && (
                  <h1
                    data-testid="app-greeting"
                    className="rt-h-display text-rt-ink mt-0.5 truncate"
                  >
                    {greeting}
                  </h1>
                )}
              </div>
              {trailing && <div className="flex-shrink-0">{trailing}</div>}
            </div>
          </div>
        )}
        {children}
      </main>
      <nav
        data-testid="app-nav"
        className="rt-tabbar fixed bottom-0 inset-x-0 max-w-xl mx-auto"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testid}
            data-active={item.active ? "true" : undefined}
            className={`${item.variant === "poke" ? "rt-tab-poke" : ""} ${
              item.active ? "is-active" : ""
            }`}
            style={{
              color:
                item.variant === "poke"
                  ? "var(--rt-poke)"
                  : item.active
                    ? "var(--rt-ink)"
                    : "var(--rt-ink-mute)",
            }}
          >
            <span
              className="inline-flex items-center justify-center"
              style={{ height: 22 }}
            >
              <Icon
                name={item.icon}
                size={item.variant === "poke" ? 22 : 18}
                color={
                  item.variant === "poke" && item.active
                    ? "var(--rt-poke)"
                    : undefined
                }
                style={
                  item.variant === "poke" && item.active
                    ? { fill: "var(--rt-poke)" }
                    : undefined
                }
              />
            </span>
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
