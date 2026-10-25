import { defineProject } from "vitest/config";
import { unitTestEnv } from "../../test/vitest-shared.mjs";

export default defineProject({
  test: {
    name: "ui",
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    env: unitTestEnv,
    setupFiles: ["../../test/dom-setup.ts"],
  },
});
