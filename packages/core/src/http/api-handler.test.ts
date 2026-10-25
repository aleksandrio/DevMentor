import { describe, expect, it } from "vitest";
import { call } from "../../test/http";
import { ApiResponse, apiHandler } from "./api-handler";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

const student = { userId: "user-1", role: "student" } as const;

describe("apiHandler", () => {
  it("wraps the result in the success envelope", async () => {
    const handler = apiHandler(async () => ({ hello: "world" }), { auth: "public" });
    const result = await call(handler);
    expect(result).toMatchObject({ status: 200, body: { ok: true, data: { hello: "world" } } });
  });

  it("applies status and headers from ApiResponse", async () => {
    const handler = apiHandler(async () => new ApiResponse("created", { status: 201, headers: { "X-Test": "1" } }), {
      auth: "public",
    });
    const result = await call(handler);
    expect(result.status).toBe(201);
    expect(result.headers.get("X-Test")).toBe("1");
  });

  it.each([
    [new ValidationError({ email: ["Zły e-mail"] }), 400, "validation_error"],
    [new UnauthorizedError(), 401, "unauthorized"],
    [new ForbiddenError(), 403, "forbidden"],
    [new NotFoundError(), 404, "not_found"],
    [new ConflictError("Zajęte"), 409, "conflict"],
    [new RateLimitError(60), 429, "rate_limited"],
  ])("maps %s to its status", async (error, status, code) => {
    const handler = apiHandler(async () => Promise.reject(error), { auth: "public" });
    const result = await call(handler);
    expect(result.status).toBe(status);
    expect(result.body).toMatchObject({ ok: false, error: { code, message: error.message } });
  });

  it("passes field errors and Retry-After through", async () => {
    const validation = await call(apiHandler(async () => Promise.reject(new ValidationError({ email: ["Zły e-mail"] })), { auth: "public" }));
    expect(validation.body.error.fieldErrors).toEqual({ email: ["Zły e-mail"] });
    const limited = await call(apiHandler(async () => Promise.reject(new RateLimitError(42)), { auth: "public" }));
    expect(limited.headers.get("Retry-After")).toBe("42");
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const handler = apiHandler(async () => Promise.reject(new Error("password=hunter2 at db.ts:12")), { auth: "public" });
    const result = await call(handler);
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("internal_error");
    expect(JSON.stringify(result.body)).not.toContain("hunter2");
  });

  it("rejects state-changing requests without the CSRF header", async () => {
    let called = false;
    const handler = apiHandler(async () => (called = true), { auth: "public" });
    const result = await call(handler, { method: "POST", withCsrfHeader: false });
    expect(result.status).toBe(403);
    expect(called).toBe(false);
    expect((await call(handler, { method: "GET", withCsrfHeader: false })).status).toBe(200);
  });

  it("requires a session by default and exposes it to the handler", async () => {
    const handler = apiHandler(async ({ session }) => session.userId);
    expect((await call(handler)).status).toBe(401);
    expect((await call(handler, { session: student })).body.data).toBe("user-1");
  });

  it("fails closed on a tampered token", async () => {
    const handler = apiHandler(async () => "secret data");
    const result = await call(handler, { token: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4Iiwicm9sZSI6ImFkbWluIn0." });
    expect(result.status).toBe(401);
  });

  it("enforces a required role", async () => {
    const handler = apiHandler(async () => "admin data", { auth: "admin" });
    expect((await call(handler, { session: student })).status).toBe(403);
    expect((await call(handler, { session: { userId: "a", role: "admin" } })).status).toBe(200);
  });
});
