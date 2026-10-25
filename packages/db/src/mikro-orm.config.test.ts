import { existsSync } from "node:fs";
import { Migrator } from "@mikro-orm/migrations";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({ existsSync: vi.fn() }));

async function loadConfig() {
  vi.resetModules();
  return (await import("./mikro-orm.config")).default;
}

beforeEach(() => {
  vi.spyOn(process, "loadEnvFile").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("MikroORM CLI config", () => {
  it("adds the migrator and the migrations folder to the runtime options", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.stubEnv("DATABASE_URL", "postgres://a:b@db:5432/devmentor");

    const config = await loadConfig();
    expect(config.clientUrl).toBe("postgres://a:b@db:5432/devmentor");
    expect(config.extensions).toEqual([Migrator]);
    expect(config.migrations?.path).toMatch(/packages\/db\/src\/migrations$/);
    expect(config.migrations?.pathTs).toBe(config.migrations?.path);
    expect(process.loadEnvFile).not.toHaveBeenCalled();
  });

  it("reads the root .env when it exists", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.stubEnv("DATABASE_URL", "postgres://a:b@db:5432/devmentor");

    await loadConfig();
    expect(process.loadEnvFile).toHaveBeenCalledWith(expect.stringMatching(/DevMentor\/\.env$|\/\.env$/));
    expect(vi.mocked(existsSync).mock.calls[0][0]).not.toMatch(/packages\/\.env$/);
  });

  it("refuses to start without DATABASE_URL", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.stubEnv("DATABASE_URL", "");

    await expect(loadConfig()).rejects.toThrow("DATABASE_URL is not set");
  });
});
