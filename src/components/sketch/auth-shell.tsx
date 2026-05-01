import Link from "next/link";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testid?: string;
}

/**
 * Standard wrapper for /auth/* pages — paper card on a paper background,
 * handwritten title, gentle entry animation. Keeps the look consistent
 * across signup / login / forgot / reset / verify-email.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  testid,
}: AuthShellProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <Link
        href="/"
        className="mb-6 font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute hover:text-rt-ink transition-colors"
      >
        ← REMIND · TOGETHER
      </Link>
      <div
        data-testid={testid}
        className="w-full max-w-md rt-box p-7 sm:p-9 rt-fade-up"
      >
        {eyebrow && (
          <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rt-ink-mute">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 font-[family-name:var(--font-kalam)] text-[15px] text-rt-ink-soft leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-8 border-t border-dashed border-rt-ink-faint pt-5 text-sm">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
