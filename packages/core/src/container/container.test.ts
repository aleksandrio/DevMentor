import { afterEach, describe, expect, it, vi } from "vitest";
import type { EntityManager, MikroORM } from "@devmentor/db";

vi.mock("@devmentor/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/db")>()),
  getOrm: vi.fn(),
}));

/**
 * Fresh container module state (the container is cached per process). Classes
 * come from the same fresh module graph, so instanceof checks hold.
 */
async function load() {
  vi.resetModules();
  const db = await import("@devmentor/db");
  return {
    getOrm: vi.mocked(db.getOrm),
    ...(await import("./container")),
    ...(await import("./scope")),
    ...(await import("../http/errors")),
    ...(await import("../services/auth/auth.service")),
    ...(await import("../services/auth/user.service")),
    ...(await import("../services/health/adapters/mikro-orm-database-health-probe")),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("container without a database", () => {
  it("builds once and reports every database feature as unavailable", async () => {
    const { getContainer, getOrm, withScope, ServiceUnavailableError } = await load();

    const container = await getContainer();
    expect(await getContainer()).toBe(container);
    expect(getOrm).not.toHaveBeenCalled();
    expect(container.cradle.orm).toBeNull();
    expect(container.cradle.config.databaseUrl).toBeNull();

    await withScope(async (cradle) => {
      expect(cradle.databaseHealthProbe).toBeNull();
      expect(await cradle.systemHealthService.checkDatabase()).toEqual({ state: "not-configured" });
      expect(() => cradle.userService).toThrow(ServiceUnavailableError);
      expect(() => cradle.em).toThrow();
    });
  });

  it("does not cache a build that failed on an invalid environment", async () => {
    const { getContainer } = await load();
    vi.stubEnv("LOG_LEVEL", "loud");
    await expect(getContainer()).rejects.toThrow("Invalid environment configuration");

    vi.stubEnv("LOG_LEVEL", "silent");
    await expect(getContainer()).resolves.toBeDefined();
  });
});

describe("container with a database", () => {
  it("gives every scope its own EntityManager fork and the ORM-backed services", async () => {
    const { getOrm, withScope, AuthService, MikroOrmDatabaseHealthProbe, UserService } = await load();
    vi.stubEnv("DATABASE_URL", "postgres://a:b@db:5432/devmentor");
    const forks = [{ id: 1 }, { id: 2 }] as unknown as EntityManager[];
    const fork = vi.fn().mockReturnValueOnce(forks[0]).mockReturnValueOnce(forks[1]);
    getOrm.mockResolvedValue({ em: { fork } } as unknown as MikroORM);

    const first = await withScope(async (cradle) => {
      expect(cradle.databaseHealthProbe).toBeInstanceOf(MikroOrmDatabaseHealthProbe);
      expect(cradle.userService).toBeInstanceOf(UserService);
      expect(cradle.authService).toBeInstanceOf(AuthService);
      return cradle.em;
    });
    const second = await withScope(async ({ em }) => em);

    expect(getOrm).toHaveBeenCalledWith({ databaseUrl: "postgres://a:b@db:5432/devmentor" });
    expect([first, second]).toEqual(forks);
  });
});

describe("withScope", () => {
  it("rethrows the error of the scoped function", async () => {
    const { withScope } = await load();
    await expect(withScope(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
  });
});
