import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";

const spawnSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync }));

const { createDeps } = await import("./deps.mjs");
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const platform = process.platform;

describe("createDeps", () => {
  beforeEach(() => spawnSync.mockReset());
  afterEach(() => Object.defineProperty(process, "platform", { value: platform }));

  it("points at the repository root and the running Node.js", async () => {
    const deps = createDeps();
    const fs = await import("node:fs");
    const crypto = await import("node:crypto");

    expect(deps.root).toBe(ROOT);
    expect(fs.existsSync(`${deps.root}/package.json`)).toBe(true);
    expect(deps.nodeVersion).toBe(process.versions.node);
    expect(deps.fs).toBe(fs);
    expect(deps.randomBytes).toBe(crypto.randomBytes);
  });

  it("captures the output of a check", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    spawnSync.mockReturnValue({ status: 0, stdout: "out", stderr: "err" });

    expect(createDeps().exec("docker", ["info"])).toEqual({ status: 0, stdout: "out", stderr: "err" });
    expect(spawnSync).toHaveBeenCalledWith("docker", ["info"], { cwd: ROOT, encoding: "utf8", stdio: "pipe", shell: false });
  });

  it("streams an inherited command and uses a shell on Windows", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    spawnSync.mockReturnValue({ status: null, stdout: null, stderr: null });

    expect(createDeps().exec("npm", ["install"], { inherit: true })).toEqual({ status: null, stdout: "", stderr: "" });
    expect(spawnSync).toHaveBeenCalledWith("npm", ["install"], { cwd: ROOT, encoding: "utf8", stdio: "inherit", shell: true });
  });

  it("writes log lines to stdout and errors to stderr", () => {
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const deps = createDeps();

    deps.log("ok");
    deps.error("bad");

    expect(stdout).toHaveBeenCalledWith("ok\n");
    expect(stderr).toHaveBeenCalledWith("bad\n");
    stdout.mockRestore();
    stderr.mockRestore();
  });
});
