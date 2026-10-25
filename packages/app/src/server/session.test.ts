// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import { createSessionToken, type Cradle } from "@devmentor/core";
import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";
import { withRequestScope } from "./request-scope";
import { getSession } from "./session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("./request-scope", () => ({ withRequestScope: vi.fn() }));

const authSecret = new TextEncoder().encode("session-test-secret-that-is-32-bytes-long");

function withCookie(value: string | undefined) {
  const get = vi.fn((name: string) => (value === undefined ? undefined : { name, value }));
  vi.mocked(cookies).mockResolvedValue({ get } as unknown as Awaited<ReturnType<typeof cookies>>);
  vi.mocked(withRequestScope).mockImplementation((fn) => fn({ config: { authSecret } } as unknown as Cradle));
  return get;
}

describe("getSession", () => {
  it("returns the verified session from the session cookie", async () => {
    const token = await createSessionToken({ userId: "user-1", role: "admin" }, authSecret);
    const get = withCookie(token);
    await expect(getSession()).resolves.toEqual({ userId: "user-1", role: "admin" });
    expect(get).toHaveBeenCalledWith("devmentor_session");
  });

  it("returns null without a cookie", async () => {
    withCookie(undefined);
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns null for a tampered token", async () => {
    withCookie("not.a.jwt");
    await expect(getSession()).resolves.toBeNull();
  });
});
