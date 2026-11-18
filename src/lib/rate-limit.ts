/**
 * Minimal fixed-window rate limiter.
 * In-memory, so it is per server instance — good enough for local/dev and a
 * first line of defence. Swap for a shared store (e.g. Upstash Redis) in
 * production on Vercel, where instances are ephemeral.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}
