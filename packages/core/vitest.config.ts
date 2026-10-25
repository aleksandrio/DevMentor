import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: "",
      AUTH_SECRET: "unit-test-secret-that-is-at-least-32-bytes",
    },
  },
  resolve: {
    // `server-only` throws outside React Server Components; tests are server code.
    alias: { "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)) },
  },
});
