import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { logoutAction } from "@/app/auth/login/actions";
import { SketchNotice } from "@/components/sketch/notice";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  return (
    <main className="min-h-screen px-5 py-10 flex flex-col items-center">
      <Link
        href="/"
        className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute hover:text-rt-ink transition-colors"
      >
        ← REMIND · TOGETHER
      </Link>

      <div className="mt-8 w-full max-w-2xl rt-box p-8 sm:p-10 rt-fade-up">
        <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute">
          TODAY · 今日小赢
        </p>
        <h1
          data-testid="app-greeting"
          className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[44px] leading-[0.95]"
        >
          你好，
          <span className="rt-hl">{user.name}</span>
        </h1>
        <p
          data-testid="app-email"
          className="mt-2 font-mono text-[12px] uppercase tracking-wide text-rt-ink-mute"
        >
          {user.email}
        </p>

        {!user.emailIsVerified && (
          <div className="mt-6">
            <SketchNotice
              tone="warn"
              testid="email-not-verified-banner"
              animate
            >
              提醒：你还没验证邮箱。请打开注册时收到的邮件，点击里面的链接完成验证。
            </SketchNotice>
          </div>
        )}

        <p className="mt-8 font-[family-name:var(--font-kalam)] text-[15px] text-rt-ink-soft leading-relaxed">
          欢迎来到 RemindTogether。Phase 1–2 骨架已就绪 — 后续阶段会在这里展开
          今日小赢、群组列表、拍拍信息等。
        </p>

        <form action={logoutAction} className="mt-10">
          <button
            type="submit"
            data-testid="logout-button"
            className="rt-btn"
          >
            退出登录
          </button>
        </form>
      </div>
    </main>
  );
}
