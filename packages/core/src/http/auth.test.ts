import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { testSecret } from "../../test/http";
import {
  assertOwns,
  clearedSessionCookie,
  createSessionToken,
  readSession,
  requireRole,
  requireSession,
  SESSION_COOKIE,
  sessionCookie,
  verifySessionToken,
} from "./auth";
import { UnauthorizedError } from "./errors";

function requestWithToken(token: string): Request {
  return new Request("http://localhost/", { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
}

describe("session tokens", () => {
  it("round-trips a session", async () => {
    const token = await createSessionToken({ userId: "u1", role: "mentor" }, testSecret);
    expect(await readSession(requestWithToken(token), testSecret)).toEqual({ userId: "u1", role: "mentor" });
  });

  it("returns null without a cookie, even without a secret", async () => {
    expect(await readSession(new Request("http://localhost/"), null)).toBeNull();
    const otherCookies = new Request("http://localhost/", { headers: { cookie: "flag; theme=dark" } });
    expect(await readSession(otherCookies, null)).toBeNull();
  });

  it("finds the session cookie among others and decodes it", async () => {
    const token = await createSessionToken({ userId: "u1", role: "student" }, testSecret);
    const request = new Request("http://localhost/", {
      headers: { cookie: `flag; theme=dark; ${SESSION_COOKIE}=${encodeURIComponent(token)}` },
    });
    expect(await readSession(request, testSecret)).toEqual({ userId: "u1", role: "student" });
  });

  it("rejects a token without a subject", async () => {
    const token = await new SignJWT({ role: "student" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(testSecret);
    expect(await verifySessionToken(token, testSecret)).toBeNull();
    expect(await verifySessionToken(undefined, null)).toBeNull();
  });

  it("requireSession returns the session or throws UnauthorizedError", async () => {
    const token = await createSessionToken({ userId: "u1", role: "mentor" }, testSecret);
    expect(await requireSession(requestWithToken(token), testSecret)).toEqual({ userId: "u1", role: "mentor" });
    await expect(requireSession(new Request("http://localhost/"), testSecret)).rejects.toThrow(UnauthorizedError);
  });

  it("rejects a token signed with another secret", async () => {
    const otherSecret = new TextEncoder().encode("another-secret-that-is-at-least-32-bytes!");
    const token = await createSessionToken({ userId: "u1", role: "admin" }, otherSecret);
    expect(await readSession(requestWithToken(token), testSecret)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await new SignJWT({ role: "student" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(testSecret);
    expect(await readSession(requestWithToken(token), testSecret)).toBeNull();
  });

  it("rejects an unknown role", async () => {
    const token = await new SignJWT({ role: "superuser" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(testSecret);
    expect(await readSession(requestWithToken(token), testSecret)).toBeNull();
  });

  it("refuses to work without a secret when a token is present", async () => {
    const token = await createSessionToken({ userId: "u1", role: "student" }, testSecret);
    await expect(readSession(requestWithToken(token), null)).rejects.toThrow("AUTH_SECRET");
    await expect(createSessionToken({ userId: "u1", role: "student" }, null)).rejects.toThrow("AUTH_SECRET");
  });
});

describe("authorization helpers", () => {
  it("requireRole and assertOwns throw ForbiddenError on mismatch", () => {
    const session = { userId: "u1", role: "student" } as const;
    expect(() => requireRole(session, "admin")).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertOwns(session, "u2")).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => assertOwns(session, "u1")).not.toThrow();
    expect(() => requireRole(session, "student")).not.toThrow();
  });
});

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, scoped to / and Secure only when asked", () => {
    expect(sessionCookie("abc", { secure: true })).toBe(
      `${SESSION_COOKIE}=abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`,
    );
    expect(sessionCookie("abc", { secure: false })).not.toContain("Secure");
    expect(clearedSessionCookie({ secure: false })).toContain("Max-Age=0");
  });
});
