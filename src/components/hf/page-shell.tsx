import Link from "next/link";

/**
 * Above-the-design strip with the brand mark + admin link. Drawn by
 * each app page, ABOVE the design's own header (date meta, display
 * title, etc.). Tiny so it doesn't push the design content around.
 */
export function AppHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div
      style={{
        padding: "10px 18px 0",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Link
        href="/"
        className="h-meta"
        style={{
          letterSpacing: "0.18em",
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
          style={{ marginLeft: "auto", color: "var(--claim)" }}
        >
          管理后台 →
        </Link>
      )}
    </div>
  );
}

/**
 * `<PageShell isAdmin tabActive={N}>` wraps a design screen with the
 * brand strip + global tabbar. The screen itself starts with `<Phone>`
 * so this component just brackets it.
 */
import type { ReactNode } from "react";
import { TabBar } from "./tabbar";

export function PageShell({
  isAdmin,
  tabActive,
  children,
}: {
  isAdmin: boolean;
  tabActive: number;
  children: ReactNode;
}) {
  return (
    <>
      {/* Header lives outside <Phone> so design's height: 100% works. */}
      <div
        style={{
          width: "100%",
          maxWidth: "var(--app-max-w)",
          margin: "0 auto",
          background: "var(--paper)",
        }}
      >
        <AppHeader isAdmin={isAdmin} />
      </div>
      {children}
      <TabBar active={tabActive} />
    </>
  );
}
