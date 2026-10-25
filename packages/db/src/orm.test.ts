import { MikroORM } from "@mikro-orm/postgresql";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getOrm } from "./orm";

const config = { databaseUrl: "postgres://a:b@db:5432/devmentor" };
const globalForOrm = globalThis as { __devmentorOrm?: unknown };

afterEach(() => {
  vi.restoreAllMocks();
  delete globalForOrm.__devmentorOrm;
});

describe("getOrm", () => {
  it("initializes one ORM per process and reuses it", async () => {
    const orm = {} as MikroORM;
    const init = vi.spyOn(MikroORM, "init").mockResolvedValue(orm);

    expect(await getOrm(config)).toBe(orm);
    expect(await getOrm(config)).toBe(orm);
    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(expect.objectContaining({ clientUrl: config.databaseUrl }));
  });

  it("does not cache a failed initialization", async () => {
    const orm = {} as MikroORM;
    const init = vi.spyOn(MikroORM, "init").mockRejectedValueOnce(new Error("unreachable")).mockResolvedValueOnce(orm);

    await expect(getOrm(config)).rejects.toThrow("unreachable");
    expect(await getOrm(config)).toBe(orm);
    expect(init).toHaveBeenCalledTimes(2);
  });
});
