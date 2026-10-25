import { describe, expect, it } from "vitest";
import { RateLimitError } from "./errors";
import { clientIp, FailureRateLimiter } from "./rate-limit";

describe("FailureRateLimiter", () => {
  const policy = { maxFailures: 5, windowMs: 15 * 60 * 1000 };

  function limiterAt(start: number) {
    let now = start;
    const limiter = new FailureRateLimiter(policy, () => now);
    return { limiter, advance: (ms: number) => (now += ms) };
  }

  it("blocks after the configured number of failures until the window ends", () => {
    const { limiter, advance } = limiterAt(0);
    for (let attempt = 0; attempt < 5; attempt++) {
      limiter.assertAllowed("1.2.3.4|a@b.pl");
      limiter.recordFailure("1.2.3.4|a@b.pl");
    }
    expect(() => limiter.assertAllowed("1.2.3.4|a@b.pl")).toThrow(RateLimitError);
    expect(() => limiter.assertAllowed("1.2.3.4|other@b.pl")).not.toThrow();
    advance(policy.windowMs);
    expect(() => limiter.assertAllowed("1.2.3.4|a@b.pl")).not.toThrow();
  });

  it("reports the remaining window as retry-after", () => {
    const { limiter, advance } = limiterAt(0);
    for (let attempt = 0; attempt < 5; attempt++) limiter.recordFailure("k");
    advance(60_000);
    try {
      limiter.assertAllowed("k");
      expect.unreachable();
    } catch (error) {
      expect((error as RateLimitError).retryAfterSeconds).toBe(14 * 60);
    }
  });

  it("reset clears the counter after a success", () => {
    const { limiter } = limiterAt(0);
    for (let attempt = 0; attempt < 5; attempt++) limiter.recordFailure("k");
    limiter.reset("k");
    expect(() => limiter.assertAllowed("k")).not.toThrow();
  });
});

describe("FailureRateLimiter memory bound", () => {
  const policy = { maxFailures: 1, windowMs: 1000 };
  const MAX_TRACKED_KEYS = 10_000;

  it("drops expired windows first when the table is full", () => {
    let now = 0;
    const limiter = new FailureRateLimiter(policy, () => now);
    limiter.recordFailure("expired");
    now = 500;
    for (let index = 1; index < MAX_TRACKED_KEYS; index++) limiter.recordFailure(`key-${index}`);
    now = 1000;

    limiter.recordFailure("new");
    expect(() => limiter.assertAllowed("new")).toThrow(RateLimitError);
    expect(() => limiter.assertAllowed("key-1")).toThrow(RateLimitError);
  });

  it("forgets the oldest window when nothing has expired", () => {
    const limiter = new FailureRateLimiter(policy, () => 0);
    for (let index = 0; index < MAX_TRACKED_KEYS; index++) limiter.recordFailure(`key-${index}`);

    limiter.recordFailure("new");
    expect(() => limiter.assertAllowed("new")).toThrow(RateLimitError);
    expect(() => limiter.assertAllowed("key-0")).not.toThrow();
    expect(() => limiter.assertAllowed("key-1")).toThrow(RateLimitError);
  });
});

describe("clientIp", () => {
  function request(forwardedFor?: string) {
    return new Request("http://localhost/", { headers: forwardedFor === undefined ? {} : { "x-forwarded-for": forwardedFor } });
  }

  it("takes the first X-Forwarded-For address", () => {
    expect(clientIp(request(" 203.0.113.7 , 10.0.0.1"))).toBe("203.0.113.7");
  });

  it("falls back to unknown", () => {
    expect(clientIp(request())).toBe("unknown");
    expect(clientIp(request(" "))).toBe("unknown");
  });
});
