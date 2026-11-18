import { NextResponse } from "next/server";
import { couponRequestSchema } from "@/lib/validation/cart";
import { evaluateCoupon } from "@/lib/coupons";
import { getProductById, priceOf } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`coupon:${ip}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const parsed = couponRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Recompute the subtotal from trusted prices — never from the client.
  let subtotal = 0;
  for (const line of parsed.data.lines) {
    const p = getProductById(line.productId);
    if (!p) continue;
    subtotal += priceOf(p) * line.qty;
  }

  const result = evaluateCoupon(parsed.data.code, subtotal);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result);
}
