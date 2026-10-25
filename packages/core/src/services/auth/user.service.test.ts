import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { User, type EntityManager } from "@devmentor/db";
import { EventBus } from "../../events/event-bus";
import { ConflictError, UnauthorizedError } from "../../http/errors";
import type { Logger } from "../../logger";
import { BCRYPT_COST, UserService } from "./user.service";

class UniqueViolation extends Error {}

vi.mock("@devmentor/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/db")>()),
  isUniqueConstraintViolation: (error: unknown) => error instanceof UniqueViolation,
}));

// Real bcrypt at the production cost would make every test ~250 ms slower.
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (password: string, cost: number) => `hash(${password},${cost})`),
    compare: vi.fn(async (password: string, hash: string) => hash.startsWith(`hash(${password},`)),
  },
}));

const createdAt = new Date("2026-10-25T10:00:00.000Z");

function storedUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: "u1",
    email: "ala@example.com",
    displayName: "Ala",
    passwordHash: "hash(password123,12)",
    role: "student",
    createdAt,
    ...overrides,
  });
}

function setup() {
  const em = {
    create: vi.fn((_entity: unknown, data: Partial<User>) => storedUser({ ...data, id: "new-id" })),
    flush: vi.fn(async () => undefined),
    findOne: vi.fn(async (): Promise<User | null> => null),
    find: vi.fn(async (): Promise<User[]> => []),
  };
  const eventBus = new EventBus({ logger: { error: vi.fn() } as unknown as Logger });
  const emit = vi.spyOn(eventBus, "emit");
  const service = new UserService({ em: em as unknown as EntityManager, eventBus });
  return { em, emit, service };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UserService.register", () => {
  it("stores a student with a bcrypt hash, emits the event and returns a DTO", async () => {
    const { em, emit, service } = setup();
    const dto = await service.register({ email: "ala@example.com", displayName: "Ala", password: "password123" });

    expect(em.create).toHaveBeenCalledWith(User, {
      email: "ala@example.com",
      displayName: "Ala",
      passwordHash: `hash(password123,${BCRYPT_COST})`,
      role: "student",
    });
    expect(em.flush).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith("auth.user.registered", { userId: "new-id", role: "student" });
    expect(dto).toEqual({
      id: "new-id",
      email: "ala@example.com",
      displayName: "Ala",
      role: "student",
      createdAt: createdAt.toISOString(),
    });
  });

  it("maps the unique-constraint violation to a generic conflict", async () => {
    const { em, emit, service } = setup();
    em.flush.mockRejectedValue(new UniqueViolation());

    await expect(service.register({ email: "ala@example.com", displayName: "Ala", password: "x" })).rejects.toThrow(
      new ConflictError("Nie można utworzyć konta z tymi danymi."),
    );
    expect(emit).not.toHaveBeenCalled();
  });

  it("rethrows other database errors", async () => {
    const { em, service } = setup();
    em.flush.mockRejectedValue(new Error("connection lost"));
    await expect(service.register({ email: "a@b.pl", displayName: "Ala", password: "x" })).rejects.toThrow("connection lost");
  });
});

describe("UserService.authenticate", () => {
  it("returns the session for valid credentials", async () => {
    const { em, service } = setup();
    em.findOne.mockResolvedValue(storedUser({ role: "mentor" }));

    expect(await service.authenticate({ email: "ala@example.com", password: "password123" })).toEqual({
      userId: "u1",
      role: "mentor",
    });
    expect(em.findOne).toHaveBeenCalledWith(User, { email: "ala@example.com" });
  });

  it("rejects a wrong password", async () => {
    const { em, service } = setup();
    em.findOne.mockResolvedValue(storedUser());
    await expect(service.authenticate({ email: "ala@example.com", password: "wrong" })).rejects.toThrow(
      new UnauthorizedError("Nieprawidłowe dane logowania."),
    );
  });

  it("rejects an unknown e-mail with the same error after comparing against a cached dummy hash", async () => {
    const { service } = setup();
    const attempt = () => service.authenticate({ email: "nobody@example.com", password: "password123" });

    await expect(attempt()).rejects.toThrow(new UnauthorizedError("Nieprawidłowe dane logowania."));
    await expect(attempt()).rejects.toThrow(UnauthorizedError);
    expect(bcrypt.compare).toHaveBeenCalledTimes(2);
    expect(vi.mocked(bcrypt.hash).mock.calls.filter(([password]) => password === "timing-equalizer")).toHaveLength(1);
  });
});

describe("UserService.list", () => {
  it("lists users newest first as DTOs without the password hash", async () => {
    const { em, service } = setup();
    em.find.mockResolvedValue([storedUser()]);

    const users = await service.list();
    expect(em.find).toHaveBeenCalledWith(User, {}, { orderBy: { createdAt: "desc" } });
    expect(users).toEqual([
      { id: "u1", email: "ala@example.com", displayName: "Ala", role: "student", createdAt: createdAt.toISOString() },
    ]);
  });
});
