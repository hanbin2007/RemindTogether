export default function Home() {
  return (
    <main className="min-h-screen bg-amber-50 dark:bg-zinc-900 px-6 py-16 flex flex-col items-center justify-center text-center font-sans">
      <h1
        data-testid="hero-title"
        className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        RemindTogether
      </h1>
      <p
        data-testid="hero-subtitle"
        className="mt-4 max-w-lg text-lg text-zinc-700 dark:text-zinc-300"
      >
        鼓励而非催促 — Phase 1 skeleton ready.
      </p>
      <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
        Server is running. Socket.io handshake available at{" "}
        <code className="font-mono">/socket.io/</code>.
      </p>
    </main>
  );
}
