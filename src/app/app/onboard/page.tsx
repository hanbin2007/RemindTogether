import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

/**
 * First-run onboarding screen — mirrors HfL2Onboard. Routed by the
 * landing page when a fresh user lands on /app for the first time.
 * Friendly framing: "not an alarm, friends help you remember".
 */
export default async function OnboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div
      data-testid="onboard-page"
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--rt-paper)" }}
    >
      <div className="px-6 pt-15 text-center max-w-md mx-auto">
        <div
          className="rt-box rt-box-thick mx-auto flex items-center justify-center"
          style={{
            width: 92,
            height: 92,
            background: "var(--rt-paper)",
            fontSize: 48,
            transform: "rotate(-4deg)",
          }}
        >
          👋
        </div>

        <h1
          className="rt-h-display mt-5"
          style={{ fontSize: 36, lineHeight: 1.1 }}
          data-testid="onboard-title"
        >
          交给一个
          <br />
          会替你
          <br />
          惦记的人
        </h1>
        <p
          className="rt-h-body mt-3.5"
          style={{
            fontFamily: "var(--font-kalam), Kalam, sans-serif",
            fontSize: 16,
            lineHeight: 1.5,
            color: "var(--rt-ink-mute)",
          }}
        >
          不是闹钟。
          <br />
          是朋友帮你记着，
          <br />
          忘了也没关系。
        </p>

        <div
          className="rt-box rt-box-dashed mt-6 p-3 text-left"
          style={{ background: "var(--rt-ok-soft)" }}
        >
          <p className="rt-h-meta">这里会发生</p>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            · 朋友帮你记
            <br />
            · 你也帮朋友记
            <br />
            · 完成了一起小庆祝
            <br />
            · 跳过了也没事 — 不算输
          </p>
        </div>
      </div>

      <div
        className="absolute left-5 right-5 max-w-md mx-auto"
        style={{ bottom: 24 }}
      >
        <Link
          href="/app"
          data-testid="onboard-cta"
          className="rt-btn rt-btn-primary w-full"
          style={{ padding: "14px 0", fontSize: 16 }}
        >
          先看看我能记什么
        </Link>
        <p className="rt-h-meta text-center mt-2">
          已经有人邀请你？
          <Link
            href="/auth/login"
            data-testid="onboard-invite-code"
            className="rt-text-claim underline ml-1"
          >
            填邀请码
          </Link>
        </p>
      </div>
    </div>
  );
}
