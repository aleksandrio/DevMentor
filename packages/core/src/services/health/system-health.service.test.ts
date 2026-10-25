import { describe, expect, it, vi } from "vitest";
import type { EntityManager } from "@devmentor/db";
import { MikroOrmDatabaseHealthProbe } from "./adapters/mikro-orm-database-health-probe";
import { SystemHealthService } from "./system-health.service";

describe("SystemHealthService.checkDatabase", () => {
  it("reports not-configured without a probe", async () => {
    expect(await new SystemHealthService({ databaseHealthProbe: null }).checkDatabase()).toEqual({ state: "not-configured" });
  });

  it("reports up with the measured latency", async () => {
    vi.spyOn(performance, "now").mockReturnValueOnce(100).mockReturnValueOnce(112.6);
    const service = new SystemHealthService({ databaseHealthProbe: { ping: async () => undefined } });
    expect(await service.checkDatabase()).toEqual({ state: "up", latencyMs: 13 });
    vi.restoreAllMocks();
  });

  it.each([
    [new Error("ECONNREFUSED"), "ECONNREFUSED"],
    ["timeout", "timeout"],
  ])("reports down with the reason for %s", async (failure, reason) => {
    const service = new SystemHealthService({ databaseHealthProbe: { ping: async () => Promise.reject(failure) } });
    expect(await service.checkDatabase()).toEqual({ state: "down", reason });
  });
});

describe("MikroOrmDatabaseHealthProbe", () => {
  it("runs a trivial query on the request's EntityManager", async () => {
    const execute = vi.fn(async () => [{ "?column?": 1 }]);
    const em = { getConnection: () => ({ execute }) } as unknown as EntityManager;

    await new MikroOrmDatabaseHealthProbe({ em }).ping();
    expect(execute).toHaveBeenCalledWith("select 1");
  });
});
