import { describe, expect, it } from "vitest";
import { RateLimitError } from "./errors";
import { FailureRateLimiter } from "./rate-limit";

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
