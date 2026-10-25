import { afterAll, describe, expect, it, vi } from "vitest";
import { call } from "../../test/http";
import { apiHandler } from "./api-handler";

// Set before the first getContainer() of this file: the container cannot be
// built, so there is no logger either.
vi.stubEnv("LOG_LEVEL", "loud");

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("apiHandler when the container cannot be built", () => {
  it("answers a generic 500 and falls back to console.error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = apiHandler(async () => "unreachable", { auth: "public" });

    const result = await call(handler, { url: "http://localhost/api/broken?x=1" });
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("internal_error");
    expect(consoleError).toHaveBeenCalledWith(
      "unhandled error in API route",
      expect.objectContaining({ method: "GET", url: "/api/broken" }),
    );
  });
});
