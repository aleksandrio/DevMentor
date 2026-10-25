import { pino } from "pino";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getOrm, User, type MikroORM } from "@devmentor/db";
import { ConflictError, EventBus, UnauthorizedError, UserService, withScope } from "@devmentor/core";
import { testDatabaseUrl } from "../../../test/integration/context";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}

describe("UserService on PostgreSQL", () => {
  let orm: MikroORM;
  const registered = vi.fn();

  function service(): UserService {
    const eventBus = new EventBus({ logger: pino({ level: "silent" }) });
    eventBus.on("auth.user.registered", registered);
    // Every service gets its own fork, like every request does.
    return new UserService({ em: orm.em.fork(), eventBus });
  }

  beforeAll(async () => {
    orm = await getOrm({ databaseUrl: testDatabaseUrl() });
  });

  afterAll(async () => {
    await orm.close();
  });

  it("stores a student with a bcrypt hash and emits auth.user.registered", async () => {
    const email = uniqueEmail("register");
    const user = await service().register({ email, displayName: "Ala", password: "password123" });

    expect(user).toMatchObject({ email, displayName: "Ala", role: "student" });
    expect(user).not.toHaveProperty("passwordHash");
    const stored = await orm.em.fork().findOneOrFail(User, { email });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(registered).toHaveBeenCalledWith({ userId: user.id, role: "student" });
  });

  it("rejects a second account with the same e-mail through the unique constraint", async () => {
    const email = uniqueEmail("duplicate");
    await service().register({ email, displayName: "Ala", password: "password123" });
    await expect(service().register({ email, displayName: "Ola", password: "password123" })).rejects.toThrow(
      ConflictError,
    );
  });

  it("lets exactly one of two concurrent registrations of one e-mail win", async () => {
    const email = uniqueEmail("race");
    const results = await Promise.allSettled([
      service().register({ email, displayName: "Ala", password: "password123" }),
      service().register({ email, displayName: "Ola", password: "password123" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const [rejected] = results.filter((result) => result.status === "rejected");
    expect(rejected.reason).toBeInstanceOf(ConflictError);
    expect(await orm.em.fork().count(User, { email })).toBe(1);
  });

  it("authenticates valid credentials and rejects the rest with one generic error", async () => {
    const email = uniqueEmail("login");
    const user = await service().register({ email, displayName: "Ala", password: "password123" });

    expect(await service().authenticate({ email, password: "password123" })).toEqual({
      userId: user.id,
      role: "student",
    });
    await expect(service().authenticate({ email, password: "wrong-password" })).rejects.toThrow(UnauthorizedError);
    await expect(
      service().authenticate({ email: uniqueEmail("unknown"), password: "password123" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("lists users newest first, as DTOs", async () => {
    const older = await service().register({ email: uniqueEmail("older"), displayName: "Ala", password: "password123" });
    const newer = await service().register({ email: uniqueEmail("newer"), displayName: "Ola", password: "password123" });

    const ids = (await service().list()).map((user) => user.id);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
  });
});

describe("withScope with a configured database", () => {
  it("wires the ORM-backed services", async () => {
    vi.stubEnv("DATABASE_URL", testDatabaseUrl());
    const status = await withScope(async ({ systemHealthService, userService }) => {
      expect(await userService.list()).toBeInstanceOf(Array);
      return systemHealthService.checkDatabase();
    });
    expect(status).toMatchObject({ state: "up" });
  });
});
