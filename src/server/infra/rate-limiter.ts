/**
 * In-memory sliding-window rate limiter.
 *
 * Designed for single-instance / serverless deployments where a lightweight
 * in-process guard is sufficient to blunt abuse (the app does not run a
 * Redis-backed backend today). Buckets self-clean: stale entries are evicted
 * on access and periodically, so the Map cannot grow without bound.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > windowMs) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param key      Stable identity of the caller (e.g. `chat:${userId}` or `ip:${ip}`).
 * @param limit    Max requests allowed inside the window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  if (buckets.size >= MAX_KEYS && !buckets.has(key)) {
    // Hard cap: refuse to track more identities rather than grow unbounded.
    return { allowed: true, remaining: 0, retryAfterMs: 0 };
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(1, windowMs - (now - oldest)),
    };
  }

  bucket.hits.push(now);
  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfterMs: 0,
  };
}

/**
 * Extract a best-effort client IP from proxy headers.
 *
 * Trust order:
 * 1. `x-real-ip` — set by trusted reverse proxies / the hosting platform
 *    (Vercel sets it to the actual client IP).
 * 2. The RIGHTMOST `x-forwarded-for` entry — the hop added by the proxy
 *    closest to this server, i.e. the least client-controllable value.
 *    (Taking the first entry lets any client rotate its rate-limit identity
 *    by sending `X-Forwarded-For: <random-ip>`.)
 *
 * Residual limitation: when the app is directly exposed with no trusted
 * proxy in front, both headers are fully client-controlled — a durable fix
 * requires platform-level IP passthrough (e.g. Vercel, which overwrites
 * these headers) or a signed proxy hop.
 */
export function clientIpFrom(headers: Headers): string {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}
