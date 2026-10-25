import { defineProject } from "vitest/config";
import { serverOnlyStub, unitTestEnv } from "../../test/vitest-shared.mjs";

export default defineProject({
  test: {
    name: "db",
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: unitTestEnv,
  },
  resolve: { alias: serverOnlyStub },
});
