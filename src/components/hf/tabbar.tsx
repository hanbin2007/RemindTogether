"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/sketch/icon";

/**
 * 1:1 port of design/project/hf-shared.jsx `TabBar` (lines 49-68).
 * The design's inline SVG icon set is replaced with the real Icon
 * component (same paths, just imported). 5 fixed slots: 今天 / 群组 /
 * 拍拍 (centered, poke-color) / 私人 / 我.
 *
 * Pages call `<TabBar active={N} />` exactly like the design (where
 * N is 0..4). When this is the active app shell, we route via real
 * Next.js URLs so a tab tap = navigation.
 */

interface Item {
  href: string;
  label: string;
  icon: IconName;
  testid: string;
}

const ITEMS: Item[] = [
  { href: "/app", label: "今天", icon: "home", testid: "nav-today" },
  { href: "/app/groups", label: "群组", icon: "users", testid: "nav-groups" },
  // Center 拍拍 — poke red, outline bolt that fills when active.
  { href: "/app/me/notifications", label: "拍拍", icon: "bolt", testid: "nav-poke" },
  { href: "/app/private", label: "私人", icon: "menu", testid: "nav-private" },
  { href: "/app/me", label: "我", icon: "person", testid: "nav-me" },
];

export function TabBar({ active = 0 }: { active?: number }) {
  return (
    <div
      className="hf-tabbar"
      style={{
        position: "fixed",
        bottom: 0,
        // Center on wide screens (left+right+margin auto can be flaky on
        // fixed elements; explicit transform is bulletproof).
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "var(--app-max-w)",
        zIndex: 20,
      }}
      data-testid="app-nav"
    >
      {ITEMS.map((t, i) => {
        const isPoke = i === 2;
        const isActive = i === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            data-testid={t.testid}
            data-active={isActive ? "true" : undefined}
            className={isActive ? "active" : ""}
            style={{
              color: isPoke
                ? "var(--poke)"
                : isActive
                  ? "var(--ink)"
                  : "var(--ink-mute)",
            }}
          >
            <span
              style={{
                height: 22,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon
                name={t.icon}
                size={isPoke ? 22 : 18}
                style={
                  isPoke && isActive ? { fill: "var(--poke)" } : undefined
                }
              />
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
