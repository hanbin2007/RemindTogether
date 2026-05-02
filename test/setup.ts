import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { config as loadEnv } from "dotenv";

// Load .env (DATABASE_URL etc) — vitest does not do this automatically.
loadEnv({ quiet: true });

afterEach(() => {
  cleanup();
});
