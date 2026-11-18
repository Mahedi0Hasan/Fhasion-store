import { NextResponse } from "next/server";
import { couponRequestSchema } from "@/lib/validation/cart";
import { evaluateCoupon } from "@/lib/coupons";
import { getProductById, priceOf } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`coupon:${ip}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = couponRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { code, lines } = parsed.data;

  // With a database, the coupons table and DB prices are the source of truth.
  if (isDbConfigured()) {
    const { data, error } = await serviceClient().rpc("quote_cart", {
      p_lines: lines.map((l) => ({ product: l.productId, size: l.size, qty: l.qty })),
      p_coupon: code,
    });
    if (error) return NextResponse.json({ error: "Couldn't check that code right now." }, { status: 502 });
    const q = data as { code?: string; discount_bdt?: number; label?: string; error?: string };
    if (q.error || !q.code) return NextResponse.json({ error: q.error ?? "That code isn't valid." }, { status: 422 });
    return NextResponse.json({ ok: true, code: q.code, discountBDT: q.discount_bdt, label: q.label });
  }

  // Fallback (no DB yet): demo coupon table, prices recomputed server-side.
  const subtotal = lines.reduce((sum, l) => {
    const p = getProductById(l.productId);
    return p ? sum + priceOf(p) * l.qty : sum;
  }, 0);
  const result = evaluateCoupon(code, subtotal);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
