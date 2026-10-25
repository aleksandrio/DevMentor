// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import type { AuthService, Cradle, HandlerContext } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Unwraps apiHandler: the route exports the handler itself with its options.
vi.mock("@devmentor/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/core")>()),
  apiHandler: (handler: object, options: object) => Object.assign(handler, { options }),
}));

type Handler = ((context: HandlerContext<"public", Record<string, never>>) => Promise<unknown>) & {
  options: { auth?: string };
};
const handler = POST as unknown as Handler;

function call(body: unknown, { isProduction = false } = {}) {
  const login = vi.fn<AuthService["login"]>().mockResolvedValue({
    session: { userId: "user-1", role: "student" },
    token: "signed.jwt",
  });
  const cradle = { authService: { login }, config: { isProduction } } as unknown as Cradle;
  const request = new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    body: JSON.stringify(body),
  });
  return { login, result: handler({ request, params: {}, session: null, cradle }) };
}

describe("POST /api/auth/login", () => {
  it("is public", () => {
    expect(handler.options).toEqual({ auth: "public" });
  });

  it("logs in with the parsed input and sets the session cookie", async () => {
    const { login, result } = call({ email: " Ala@Example.com ", password: "secret", role: "admin" });
    const response = await result;

    expect(login).toHaveBeenCalledWith({ email: "ala@example.com", password: "secret" }, "203.0.113.7");
    expect(response).toMatchObject({ data: { userId: "user-1", role: "student" } });
    const cookie = new Headers((response as { init: { headers: HeadersInit } }).init.headers).get("Set-Cookie");
    expect(cookie).toContain("devmentor_session=signed.jwt");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).not.toContain("Secure");
  });

  it("marks the cookie Secure in production", async () => {
    const response = await call({ email: "ala@example.com", password: "secret" }, { isProduction: true }).result;
    const cookie = new Headers((response as { init: { headers: HeadersInit } }).init.headers).get("Set-Cookie");
    expect(cookie).toContain("Secure");
  });

  it("rejects invalid input before calling the service", async () => {
    const { login, result } = call({ email: "not-an-email" });
    await expect(result).rejects.toMatchObject({ status: 400 });
    expect(login).not.toHaveBeenCalled();
  });
});
