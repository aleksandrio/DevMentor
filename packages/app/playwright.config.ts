import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Same root .env as next.config.ts, so the tests know whether the server
// under test has a database (DATABASE_URL) and expect the matching status.
const rootEnvFile = path.join(__dirname, "../../.env");
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

// `next start` runs in production mode, where AUTH_SECRET is required. Use a
// throwaway one unless the environment provides a secret.
process.env.AUTH_SECRET ||= "e2e-only-secret-not-for-real-use-0123456789";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Always test a fresh production build.
    command: `next build && next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
