import { describe, it, expect } from "vitest";
import { limiters, clientIp } from "./rate-limit";

// With no Upstash credentials in the test env, the limiters fall back to the
// in-memory implementation, which is deterministic per-process — ideal for unit
// testing the policy itself (the limits, not the Redis transport).

describe("auth limiter policy (brute-force protection)", () => {
  it("allows exactly 5 attempts then blocks the 6th in the window", async () => {
    const id = `auth-test-${Math.random()}`;
    const outcomes: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const { success } = await limiters.auth.limit(id);
      outcomes.push(success);
    }
    expect(outcomes).toEqual([true, true, true, true, true, false]);
  });

  it("tracks limits independently per identifier (per-IP)", async () => {
    const a = `auth-a-${Math.random()}`;
    const b = `auth-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) await limiters.auth.limit(a);
    // `a` is now exhausted, but `b` is untouched.
    expect((await limiters.auth.limit(a)).success).toBe(false);
    expect((await limiters.auth.limit(b)).success).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first hop of x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 70.41.3.18" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip then 'anonymous'", () => {
    const withReal = new Request("https://x.test", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(clientIp(withReal)).toBe("198.51.100.2");
    expect(clientIp(new Request("https://x.test"))).toBe("anonymous");
  });
});
