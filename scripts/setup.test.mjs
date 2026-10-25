import { afterEach, expect, it, vi } from "vitest";

const deps = vi.hoisted(() => ({ root: "/repo" }));
const runSetup = vi.hoisted(() => vi.fn());
vi.mock("./setup/deps.mjs", () => ({ createDeps: () => deps }));
vi.mock("./setup/steps.mjs", () => ({ runSetup }));

afterEach(() => {
  // A leaked exit code of 1 would fail the whole Vitest run.
  process.exitCode = undefined;
  vi.resetModules();
});

it.each([0, 1])("sets the process exit code to %i from runSetup", async (code) => {
  runSetup.mockReturnValue(code);

  await import("./setup.mjs");

  expect(runSetup).toHaveBeenCalledWith(deps);
  expect(process.exitCode).toBe(code);
});
