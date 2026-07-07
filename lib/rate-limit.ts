// In-memory rate limiter for simple protection
// NOTE: In serverless environments (like Vercel), memory is isolated per function instance.
// This provides basic protection per instance, but for robust protection across a cluster,
// consider using @upstash/ratelimit with Redis.

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const rateLimiterMap = new Map<string, RateLimitTracker>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimiterMap.get(ip);

  // Clean up expired records occasionally
  if (Math.random() < 0.1) {
    for (const [key, value] of rateLimiterMap.entries()) {
      if (value.resetAt < now) rateLimiterMap.delete(key);
    }
  }

  if (!record || record.resetAt < now) {
    rateLimiterMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (record.count >= limit) {
    return { success: false };
  }

  record.count += 1;
  return { success: true };
}
