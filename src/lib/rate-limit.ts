import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/**
 * Rate limiting for abuse-sensitive endpoints (checkout, auth, webhooks, admin).
 *
 * Production: backed by Upstash Redis (distributed, survives multiple instances).
 * Local dev with no Upstash creds: falls back to a simple in-memory limiter so
 * you can develop without external services. The in-memory path is per-process
 * and NOT safe for production — env.ts requires the Upstash vars in prod.
 */

const hasUpstash =
  !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN;

type LimitResult = { success: boolean; limit: number; remaining: number };

interface Limiter {
  limit(identifier: string): Promise<LimitResult>;
}

function createUpstashLimiter(
  requests: number,
  window: `${number} s`,
): Limiter {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: "barnett-art",
  });
  return {
    async limit(id) {
      const r = await rl.limit(id);
      return { success: r.success, limit: r.limit, remaining: r.remaining };
    },
  };
}

function createMemoryLimiter(requests: number, windowSeconds: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(id) {
      const now = Date.now();
      const windowStart = now - windowSeconds * 1000;
      const recent = (hits.get(id) ?? []).filter((t) => t > windowStart);
      recent.push(now);
      hits.set(id, recent);
      const remaining = Math.max(0, requests - recent.length);
      return { success: recent.length <= requests, limit: requests, remaining };
    },
  };
}

function makeLimiter(requests: number, windowSeconds: number): Limiter {
  return hasUpstash
    ? createUpstashLimiter(requests, `${windowSeconds} s`)
    : createMemoryLimiter(requests, windowSeconds);
}

/** Per-endpoint-class limiters. Tune as real traffic patterns emerge. */
export const limiters = {
  checkout: makeLimiter(10, 60), // 10 checkout attempts / min / IP
  webhook: makeLimiter(100, 60), // generous; Stripe retries legitimately
  admin: makeLimiter(30, 60),
  api: makeLimiter(60, 60), // general read endpoints
};

/** Best-effort client IP from proxy headers (Vercel/CloudFront set these). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
