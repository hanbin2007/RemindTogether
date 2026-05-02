import { TickButton } from "./tick-button";

export const dynamic = "force-dynamic";

export default function AdminToolsPage() {
  return (
    <div data-testid="admin-tools">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        工具
      </h1>
      <p className="mt-2 font-[family-name:var(--font-kalam)] text-rt-ink-soft">
        手动触发的运维操作。每次成功调用都落 AdminLog。
      </p>

      <section
        className="mt-6 rt-box p-5"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
          STREAK · 手动 close-out
        </p>
        <p className="mt-1 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm">
          立刻为所有用户走一遍 close-out（cron 每 30 min 自动跑一次）。
          连击会被去抖：30 秒内重复点击返回零结果。
        </p>
        <TickButton />
      </section>
    </div>
  );
}
