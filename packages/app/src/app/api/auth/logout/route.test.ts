// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import type { ApiResponse, Cradle, HandlerContext } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Unwraps apiHandler: the route exports the handler itself with its options.
vi.mock("@devmentor/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/core")>()),
  apiHandler: (handler: object, options: object) => Object.assign(handler, { options }),
}));

type Handler = ((context: HandlerContext<"public", Record<string, never>>) => Promise<ApiResponse<null>>) & {
  options: { auth?: string };
};
const handler = POST as unknown as Handler;

function logout(isProduction: boolean) {
  const cradle = { config: { isProduction } } as unknown as Cradle;
  const request = new Request("http://localhost/api/auth/logout", { method: "POST" });
  return handler({ request, params: {}, session: null, cradle });
}

describe("POST /api/auth/logout", () => {
  it("is public, so an expired session can still log out", () => {
    expect(handler.options).toEqual({ auth: "public" });
  });

  it("clears the session cookie", async () => {
    const response = await logout(false);
    expect(response.data).toBeNull();
    const cookie = new Headers(response.init.headers).get("Set-Cookie");
    expect(cookie).toContain("devmentor_session=;");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).not.toContain("Secure");
  });

  it("marks the cleared cookie Secure in production", async () => {
    const response = await logout(true);
    expect(new Headers(response.init.headers).get("Set-Cookie")).toContain("Secure");
  });
});
