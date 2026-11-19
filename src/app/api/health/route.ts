import { NextResponse } from "next/server";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { hasOrderTokenSecret } from "@/lib/order-token";
import { paymentOptions } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Deployment check: which pieces are configured and reachable. Reports only
 * yes/no, never values, so it's safe to leave public.
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    site_url: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    supabase_configured: isDbConfigured() && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    order_token_secret: hasOrderTokenSecret(),
    database_reachable: false,
    migrations_applied: false,
  };
  if (checks.supabase_configured) {
    const db = serviceClient();
    const [p, r] = await Promise.all([
      db.from("products").select("id", { count: "exact", head: true }),
      db.rpc("hit_rate_limit", { p_key: "health", p_limit: 1_000_000, p_window_seconds: 60 }),
    ]);
    checks.database_reachable = !p.error;
    checks.migrations_applied = !p.error && !r.error;
  }
  const ready = checks.site_url && checks.supabase_configured && checks.order_token_secret && checks.database_reachable && checks.migrations_applied;
  return NextResponse.json(
    { ready, checks, payments: paymentOptions().map((o) => ({ id: o.id, available: o.available })) },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
