import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    css: true,
    // Integration tests share the reminder_test database, so file-level
    // parallelism would step on each other's resetDb(). Sequential keeps
    // the suite simple; total run time is still under a minute.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90,
      },
    },
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "test/unit/**/*.{test,spec}.{ts,tsx}",
      "test/integration/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", "test/e2e/**", ".next/**"],
  },
});
