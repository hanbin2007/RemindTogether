import Link from "next/link";
import { Icon, type IconName } from "./icon";

/**
 * Bottom tabbar — 1:1 port of design/project/hf-shared.jsx `TabBar`.
 * Five fixed slots (今天 / 群组 / 拍拍 / 私人 / 我). Center 拍拍 is in
 * poke red and uses the outline bolt; when active the bolt fills with
 * poke color, matching the design's `fill={active===2 ? 'var(--poke)' : 'none'}`.
 *
 * Page-level chrome (header + admin link) is rendered separately by
 * `<AppHeader>` so each page can place its own inline header per the
 * design (e.g. HfToday's date meta + "今天" + avatar trailing).
 */

interface NavItem {
  href: string;
  label: string;
  testid: string;
  icon: IconName;
  active?: boolean;
  variant?: "poke";
}

export function BottomTabbar({
  current,
}: {
  current:
    | "today"
    | "private"
    | "groups"
    | "poke"
    | "me"
    | "other";
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
    <nav
      data-testid="app-nav"
      className="rt-tabbar"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        maxWidth: "36rem",
        margin: "0 auto",
        zIndex: 20,
      }}
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
  );
}

/**
 * Tiny header strip with the brand mark + admin link. Rendered above
 * each design screen by the page itself. Stays out of the design's
 * inline content so the literal port doesn't get pushed around.
 */
export function AppHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div
      style={{
        padding: "10px 18px 0",
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <Link
        href="/"
        className="h-meta"
        style={{
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        REMIND · TOGETHER
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          data-testid="link-admin"
          className="h-meta"
          style={{
            marginLeft: "auto",
            color: "var(--claim)",
          }}
        >
          管理后台 →
        </Link>
      )}
    </div>
  );
}

/** Convenience: AppHeader on top, children with bottom-tab spacing,
 * BottomTabbar fixed at bottom. Use for design screens that don't
 * draw their own page chrome. */
export function PageShell({
  current,
  isAdmin,
  children,
}: {
  current:
    | "today"
    | "private"
    | "groups"
    | "poke"
    | "me"
    | "other";
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="hf"
      style={{
        background: "var(--paper)",
        maxWidth: "36rem",
        margin: "0 auto",
        minHeight: "100vh",
        paddingBottom: 80,
        position: "relative",
      }}
    >
      <AppHeader isAdmin={isAdmin} />
      {children}
      <BottomTabbar current={current} />
    </div>
  );
}
