import { describe, expect, it, vi } from "vitest";
import { testSecret } from "../../../test/http";
import type { AppConfig } from "../../config/env";
import { verifySessionToken } from "../../http/auth";
import { ConflictError, RateLimitError, UnauthorizedError } from "../../http/errors";
import { FailureRateLimiter } from "../../http/rate-limit";
import { AuthService } from "./auth.service";
import type { UserDto, UserService } from "./user.service";

const config = { authSecret: testSecret } as AppConfig;
const user: UserDto = { id: "u1", email: "ala@example.com", displayName: "Ala", role: "student", createdAt: "2026-10-25T00:00:00.000Z" };
const credentials = { email: "ala@example.com", password: "password123" };

function setup(userService: Partial<UserService>) {
  const authRateLimiter = new FailureRateLimiter({ maxFailures: 2, windowMs: 60_000 });
  const service = new AuthService({ config, userService: userService as UserService, authRateLimiter });
  return { service, authRateLimiter };
}

describe("AuthService", () => {
  it("registers and issues a session token for the new user", async () => {
    const { service } = setup({ register: async () => user });
    const result = await service.register({ ...credentials, displayName: "Ala" }, "1.2.3.4");

    expect(result.user).toBe(user);
    expect(result.session).toEqual({ userId: "u1", role: "student" });
    expect(await verifySessionToken(result.token, testSecret)).toEqual(result.session);
  });

  it("logs in with a token for the authenticated session", async () => {
    const { service } = setup({ authenticate: async () => ({ userId: "u1", role: "mentor" }) });
    const result = await service.login(credentials, "1.2.3.4");
    expect(await verifySessionToken(result.token, testSecret)).toEqual({ userId: "u1", role: "mentor" });
  });

  it("blocks an IP + e-mail after repeated rejected attempts, per flow", async () => {
    const authenticate = vi.fn(async () => Promise.reject(new UnauthorizedError()));
    const register = vi.fn(async () => Promise.reject(new ConflictError("taken")));
    const { service } = setup({ authenticate, register });

    await expect(service.login(credentials, "1.2.3.4")).rejects.toThrow(UnauthorizedError);
    await expect(service.login(credentials, "1.2.3.4")).rejects.toThrow(UnauthorizedError);
    await expect(service.login(credentials, "1.2.3.4")).rejects.toThrow(RateLimitError);
    expect(authenticate).toHaveBeenCalledTimes(2);

    await expect(service.login(credentials, "5.6.7.8")).rejects.toThrow(UnauthorizedError);
    await expect(service.register({ ...credentials, displayName: "Ala" }, "1.2.3.4")).rejects.toThrow(ConflictError);
  });

  it("resets the counter after a success", async () => {
    const authenticate = vi
      .fn<UserService["authenticate"]>()
      .mockRejectedValueOnce(new UnauthorizedError())
      .mockResolvedValueOnce({ userId: "u1", role: "student" })
      .mockRejectedValue(new UnauthorizedError());
    const { service } = setup({ authenticate });

    await expect(service.login(credentials, "ip")).rejects.toThrow(UnauthorizedError);
    await service.login(credentials, "ip");
    await expect(service.login(credentials, "ip")).rejects.toThrow(UnauthorizedError);
    await expect(service.login(credentials, "ip")).rejects.toThrow(UnauthorizedError);
  });

  it("does not count infrastructure failures against the user", async () => {
    const { service } = setup({ authenticate: async () => Promise.reject(new Error("connection reset")) });
    for (let attempt = 0; attempt < 3; attempt++) {
      await expect(service.login(credentials, "ip")).rejects.toThrow("connection reset");
    }
  });
});
