// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import type { Cradle, DatabaseStatus, HandlerContext } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// Unwraps apiHandler: the route exports the handler itself with its options.
vi.mock("@devmentor/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/core")>()),
  apiHandler: (handler: object, options: object) => Object.assign(handler, { options }),
}));

type Handler = ((context: HandlerContext<"public", Record<string, never>>) => Promise<unknown>) & {
  options: { auth?: string };
};
const handler = GET as unknown as Handler;

function check(status: DatabaseStatus) {
  const logger = { error: vi.fn() };
  const cradle = {
    systemHealthService: { checkDatabase: vi.fn().mockResolvedValue(status) },
    logger,
  } as unknown as Cradle;
  const request = new Request("http://localhost/api/health");
  return { logger, result: handler({ request, params: {}, session: null, cradle }) };
}

describe("GET /api/health", () => {
  it("is public", () => {
    expect(handler.options).toEqual({ auth: "public" });
  });

  it.each<DatabaseStatus>([{ state: "up", latencyMs: 3 }, { state: "not-configured" }])(
    "reports $state as is",
    async (status) => {
      const { logger, result } = check(status);
      expect(await result).toEqual({ database: status });
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it("hides the reason of a down database and logs it instead", async () => {
    const { logger, result } = check({ state: "down", reason: "connect ECONNREFUSED 10.0.0.5:5432" });
    expect(await result).toEqual({ database: { state: "down" } });
    expect(logger.error).toHaveBeenCalledWith(
      { reason: "connect ECONNREFUSED 10.0.0.5:5432" },
      "database health check failed",
    );
  });
});
