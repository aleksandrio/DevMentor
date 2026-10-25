import { MikroORM } from "@mikro-orm/postgresql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../mikro-orm.config", () => ({ default: { clientUrl: "postgres://cli" } }));

const originalArgv = process.argv;
const em = { findOne: vi.fn(), flush: vi.fn() };
const orm = { em: { fork: () => em }, close: vi.fn() };

/** Runs the script (top-level await) with the given CLI arguments. */
async function promote(...args: string[]) {
  process.argv = [process.execPath, "promote-user.ts", ...args];
  vi.resetModules();
  await import("./promote-user");
}

beforeEach(() => {
  vi.spyOn(MikroORM, "init").mockResolvedValue(orm as unknown as MikroORM);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = undefined;
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("db:user:promote", () => {
  it("grants admin to the user with the normalized e-mail", async () => {
    const user = { role: "student" };
    em.findOne.mockResolvedValue(user);

    await promote("--email", "  Ala@Example.COM ");
    expect(MikroORM.init).toHaveBeenCalledWith({ clientUrl: "postgres://cli" });
    expect(em.findOne).toHaveBeenCalledWith(expect.anything(), { email: "ala@example.com" });
    expect(user.role).toBe("admin");
    expect(em.flush).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("ala@example.com is now an admin.");
    expect(orm.close).toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it("fails without changes when no user has the e-mail", async () => {
    em.findOne.mockResolvedValue(null);

    await promote("--email", "nobody@example.com");
    expect(console.error).toHaveBeenCalledWith("No user with e-mail nobody@example.com.");
    expect(em.flush).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(orm.close).toHaveBeenCalled();
  });

  it("closes the ORM when the lookup fails", async () => {
    em.findOne.mockRejectedValue(new Error("connection refused"));

    await expect(promote("--email", "ala@example.com")).rejects.toThrow("connection refused");
    expect(orm.close).toHaveBeenCalled();
  });

  it.each([[], ["--email", "   "]])("prints usage and exits for arguments %j", async (...args) => {
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    await expect(promote(...args)).rejects.toThrow("process.exit");
    expect(console.error).toHaveBeenCalledWith("Usage: npm run db:user:promote -- --email <e-mail>");
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(MikroORM.init).not.toHaveBeenCalled();
  });
});
