import "server-only";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limiter.
 * Uses the database when available, so the limit holds across serverless
 * instances; falls back to an in-memory counter (per instance) otherwise or
 * if the database call fails.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function memory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  b.count += 1;
  return { ok: b.count <= limit };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean }> {
  if (isDbConfigured()) {
    const { data, error } = await serviceClient().rpc("hit_rate_limit", {
      p_key: key.slice(0, 200), p_limit: limit, p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (!error && typeof data === "boolean") return { ok: data };
  }
  return memory(key, limit, windowMs);
}

/** Client IP as seen by the platform proxy (Vercel sets x-forwarded-for). */
export function clientIp(h: Headers) {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
