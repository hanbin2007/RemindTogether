import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-xl rt-fade-up">
        <p
          className="font-mono text-xs tracking-[0.18em] uppercase text-rt-ink-mute"
          data-testid="hero-tagline"
        >
          REMIND · TOGETHER
        </p>
        <h1
          data-testid="hero-title"
          className="mt-3 font-[family-name:var(--font-caveat)] font-bold text-rt-ink leading-[0.95] text-[clamp(56px,9vw,96px)]"
        >
          鼓励，<span className="rt-hl">而非催促</span>
        </h1>
        <p
          data-testid="hero-subtitle"
          className="mt-6 font-[family-name:var(--font-kalam)] text-lg text-rt-ink-soft leading-relaxed"
        >
          像微信群一样建群，互相打气。差一点点，朋友拍拍你 —— 不带压力。
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/signup" className="rt-btn rt-btn-primary" data-testid="cta-signup">
            创建账号
          </Link>
          <Link href="/auth/login" className="rt-btn" data-testid="cta-login">
            已有账号 · 登录
          </Link>
        </div>
        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-rt-ink-mute">
          phase 1–2 ready · socket.io @ <span className="text-rt-ink-soft">/socket.io</span>
        </p>
      </div>
    </main>
  );
}
