// Shared by every Vitest config (plain ESM, so Vite's config loader needs no
// TypeScript transform or extension guessing).
import { fileURLToPath } from "node:url";

/**
 * `server-only` throws outside React Server Components; unit and integration
 * tests run server code in plain Node.js, so every project aliases it to an
 * empty module.
 */
export const serverOnlyStub = {
  "server-only": fileURLToPath(new URL("./server-only-stub.ts", import.meta.url)),
};

/** Environment of every unit-test project: no database, a fixed test secret. */
export const unitTestEnv = /** @type {const} */ ({
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  DATABASE_URL: "",
  AUTH_SECRET: "unit-test-secret-that-is-at-least-32-bytes",
});
