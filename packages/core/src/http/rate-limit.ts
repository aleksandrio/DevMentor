import { RateLimitError } from "./errors";

export interface RateLimitPolicy {
  maxFailures: number;
  windowMs: number;
}

// Brute-force control for login and registration: 5 failures per IP + email
// in 15 minutes leaves room for typos but makes password guessing impractical.
export const AUTH_RATE_LIMIT: RateLimitPolicy = { maxFailures: 5, windowMs: 15 * 60 * 1000 };

// Bounds memory if many distinct keys arrive; expired windows are dropped first.
const MAX_TRACKED_KEYS = 10_000;

interface Window {
  failures: number;
  resetAt: number;
}

/**
 * Fixed-window failure counter kept in process memory. MVP limitation: it is
 * per process and resets on restart; production traffic needs a shared store.
 */
export class FailureRateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly policy: RateLimitPolicy,
    private readonly now: () => number = Date.now,
  ) {}

  assertAllowed(key: string): void {
    const window = this.activeWindow(key);
    if (window && window.failures >= this.policy.maxFailures) {
      throw new RateLimitError(Math.ceil((window.resetAt - this.now()) / 1000));
    }
  }

  recordFailure(key: string): void {
    const window = this.activeWindow(key);
    if (window) {
      window.failures += 1;
      return;
    }
    this.pruneIfFull();
    this.windows.set(key, { failures: 1, resetAt: this.now() + this.policy.windowMs });
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  private activeWindow(key: string): Window | undefined {
    const window = this.windows.get(key);
    if (window && window.resetAt <= this.now()) {
      this.windows.delete(key);
      return undefined;
    }
    return window;
  }

  private pruneIfFull(): void {
    if (this.windows.size < MAX_TRACKED_KEYS) {
      return;
    }
    const now = this.now();
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    }
    if (this.windows.size >= MAX_TRACKED_KEYS) {
      // Still full: forget the oldest window rather than grow without bound.
      // Maps iterate in insertion order, so the first key is the oldest.
      const [oldestKey] = this.windows.keys();
      this.windows.delete(oldestKey);
    }
  }
}

/**
 * Client IP for rate limiting. MVP limitation: X-Forwarded-For is trusted as
 * is, which is only safe behind a proxy that overwrites it.
 */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
