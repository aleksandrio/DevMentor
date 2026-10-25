import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";
import { serverOnlyStub, unitTestEnv } from "../../test/vitest-shared.mjs";

export default defineProject({
  test: {
    name: "app",
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    env: unitTestEnv,
    setupFiles: ["../../test/dom-setup.ts"],
  },
  resolve: {
    alias: { ...serverOnlyStub, "@/": fileURLToPath(new URL("./src/", import.meta.url)) },
  },
});
