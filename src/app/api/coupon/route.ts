import { NextResponse } from "next/server";
import { couponRequestSchema } from "@/lib/validation/cart";
import { evaluateCoupon } from "@/lib/coupons";
import { priceOf } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-source";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/read-json";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { getI18n } from "@/lib/i18n/server";
import { localizeCouponError, localizeCouponLabel } from "@/lib/i18n/coupon";

export async function POST(req: Request) {
  const { t, bdt: money, num } = await getI18n();
  const ip = clientIp(req.headers);
  if (!(await rateLimit(`coupon:${ip}`, 10, 60_000)).ok) {
    return NextResponse.json({ error: t("err.rate") }, { status: 429 });
  }

  const parsed = couponRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: t("err.check") }, { status: 400 });
  const { code, lines } = parsed.data;

  // With a database, the coupons table and DB prices are the source of truth.
  if (isDbConfigured()) {
    const { data, error } = await serviceClient().rpc("quote_cart", {
      p_lines: lines.map((l) => ({ product: l.productId, size: l.size, qty: l.qty })),
      p_coupon: code,
    });
    if (error) return NextResponse.json({ error: t("err.couponCheck") }, { status: 502 });
    const q = data as { code?: string; discount_bdt?: number; label?: string; error?: string };
    if (q.error || !q.code) return NextResponse.json({ error: localizeCouponError(q.error, t, money) }, { status: 422 });
    return NextResponse.json({ ok: true, code: q.code, discountBDT: q.discount_bdt, label: localizeCouponLabel(q.label, t, money, num) });
  }

  // Fallback (no DB yet): demo coupon table, prices recomputed server-side.
  const products = await getProducts();
  const subtotal = lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId);
    return p ? sum + priceOf(p) * l.qty : sum;
  }, 0);
  const result = evaluateCoupon(code, subtotal);
  if (!result.ok) return NextResponse.json({ error: localizeCouponError(result.error, t, money) }, { status: 422 });
  return NextResponse.json({ ...result, label: localizeCouponLabel(result.label, t, money, num) });
}
