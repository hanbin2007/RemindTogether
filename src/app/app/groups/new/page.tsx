/**
 * Direct port of HfL2NewGroup (design/project/hf-screens-L2.jsx
 * lines 403-481). The design is a sheet over the groups list, but
 * we render it as a dedicated page (no sheet overlay) since the
 * web URL is /app/groups/new — same content, different chrome.
 *
 * Mechanical replacements only:
 *   - <Phone> + <SheetOverlay> wrappers     → page chrome
 *   - hardcoded sample title "读书一起冲"    → controlled <input>
 *   - hardcoded "📚" cover                   → emoji from input
 *   - hardcoded "sel" type                   → selectable cards
 *   - hardcoded checkmarks on rules          → kept as default copy
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { CreateGroupSheet } from "./sheet";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return (
    <div
      className="hf min-h-screen"
      style={{
        background: "var(--paper)",
        maxWidth: "var(--app-max-w)",
        margin: "0 auto",
        padding: "12px 14px 56px",
      }}
    >
      <Link
        href="/app/groups"
        className="h-meta"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        data-testid="newgroup-back"
      >
        ‹ 群组列表
      </Link>
      <CreateGroupSheet />
    </div>
  );
}
