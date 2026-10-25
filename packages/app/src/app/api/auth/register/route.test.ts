// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import type { ApiResponse, AuthService, Cradle, HandlerContext } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Unwraps apiHandler: the route exports the handler itself with its options.
vi.mock("@devmentor/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/core")>()),
  apiHandler: (handler: object, options: object) => Object.assign(handler, { options }),
}));

type Handler = ((context: HandlerContext<"public", Record<string, never>>) => Promise<ApiResponse<unknown>>) & {
  options: { auth?: string };
};
const handler = POST as unknown as Handler;

const user = {
  id: "user-1",
  email: "ala@example.com",
  displayName: "Ala",
  role: "student" as const,
  createdAt: "2026-10-25T10:00:00.000Z",
};

function call(body: unknown, { isProduction = false, headers = {} }: { isProduction?: boolean; headers?: HeadersInit } = {}) {
  const register = vi.fn<AuthService["register"]>().mockResolvedValue({
    user,
    session: { userId: user.id, role: user.role },
    token: "signed.jwt",
  } as Awaited<ReturnType<AuthService["register"]>>);
  const cradle = { authService: { register }, config: { isProduction } } as unknown as Cradle;
  const request = new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return { register, result: handler({ request, params: {}, session: null, cradle }) };
}

const validBody = { email: "Ala@Example.com", displayName: " Ala ", password: "password123" };

describe("POST /api/auth/register", () => {
  it("is public", () => {
    expect(handler.options).toEqual({ auth: "public" });
  });

  it("registers with the parsed input, answers 201 and sets the session cookie", async () => {
    const { register, result } = call(
      { ...validBody, role: "admin", id: "forged" },
      { headers: { "x-forwarded-for": "198.51.100.2" } },
    );
    const response = await result;

    expect(register).toHaveBeenCalledWith(
      { email: "ala@example.com", displayName: "Ala", password: "password123" },
      "198.51.100.2",
    );
    expect(response.data).toEqual(user);
    expect(response.init.status).toBe(201);
    const cookie = new Headers(response.init.headers).get("Set-Cookie");
    expect(cookie).toContain("devmentor_session=signed.jwt");
    expect(cookie).not.toContain("Secure");
  });

  it("uses 'unknown' without a forwarded IP and marks the cookie Secure in production", async () => {
    const { register, result } = call(validBody, { isProduction: true });
    const response = await result;
    expect(register).toHaveBeenCalledWith(expect.any(Object), "unknown");
    expect(new Headers(response.init.headers).get("Set-Cookie")).toContain("Secure");
  });

  it("rejects invalid input before calling the service", async () => {
    const { register, result } = call({ email: "ala@example.com", displayName: "A", password: "short" });
    await expect(result).rejects.toMatchObject({ status: 400 });
    expect(register).not.toHaveBeenCalled();
  });
});
