export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  consume(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, BucketEntry>();

  async consume(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.buckets.get(key) ?? {
      tokens: options.limit,
      lastRefill: now,
    };

    // Calculate refill
    const elapsed = now - entry.lastRefill;
    if (elapsed > options.windowMs) {
      entry.tokens = options.limit;
      entry.lastRefill = now;
    }

    if (entry.tokens > 0) {
      entry.tokens -= 1;
      this.buckets.set(key, entry);
      return {
        allowed: true,
        remaining: entry.tokens,
        resetAt: entry.lastRefill + options.windowMs,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.lastRefill + options.windowMs,
    };
  }
}

export const rateLimiter: RateLimiter = new InMemoryRateLimiter();
