import { defineConfig } from "vitest/config";
import { serverOnlyStub } from "./test/vitest-shared.mjs";

// Integration tests (`npm run test:integration`): a real PostgreSQL from
// testcontainers, migrated, and a production build of the app driven through
// agent-browser. Needs Docker and `npx agent-browser install` once.
export default defineConfig({
  test: {
    include: ["packages/*/integration/**/*.int.test.ts"],
    environment: "node",
    globalSetup: ["test/integration/global-setup.ts"],
    env: { LOG_LEVEL: "silent" },
    // Container start, `next build` and browser steps are slow by nature.
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
  resolve: { alias: serverOnlyStub },
});
