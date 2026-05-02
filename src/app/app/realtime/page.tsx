import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { RealtimePanel } from "./realtime-panel";

export const dynamic = "force-dynamic";

/**
 * Realtime debug surface — gated by middleware (login required), shows
 * the live event stream from Socket.io. Useful for manual eyeballing
 * during Phase 4 and as a stable target for the Playwright realtime
 * tests. Once Phase 9 ships proper UI, this page can stay as a
 * developer tool.
 */
export default async function RealtimeDebugPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <main className="min-h-screen px-5 py-10 flex flex-col items-center">
      <Link
        href="/app"
        className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute hover:text-rt-ink transition-colors"
      >
        ← BACK
      </Link>

      <div className="mt-8 w-full max-w-2xl rt-box p-8 rt-fade-up">
        <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute">
          REALTIME · DEBUG
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
          实时事件流
        </h1>
        <p className="mt-3 font-[family-name:var(--font-kalam)] text-[15px] text-rt-ink-soft leading-relaxed">
          打开两个浏览器登录两个账号，加入同一个群。任何一个写操作都会出现在另一个
          这里。
        </p>
        <RealtimePanel userId={session.user.id} />
      </div>
    </main>
  );
}
