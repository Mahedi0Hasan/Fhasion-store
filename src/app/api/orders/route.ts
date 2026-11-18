import { NextResponse } from "next/server";
import { orderRequestSchema, toE164, zoneFor } from "@/lib/validation/checkout";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { hasOrderTokenSecret, signOrder } from "@/lib/order-token";
import { PAYMENT_ADAPTERS } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";

const FRIENDLY: Record<string, string> = {
  OUT_OF_STOCK: "Sorry, one of your items just sold out. Please review your bag.",
  UNKNOWN_ITEM: "One of your items is no longer available. Please review your bag.",
  INVALID_QTY: "Please check the quantities in your bag.",
  INVALID_ZONE: "Please check your delivery area.",
  COD_BD_ONLY: "Cash on delivery is only available in Bangladesh.",
  EMPTY_CART: "Your bag is empty.",
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`order:${ip}`, 5, 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }
  if (!isDbConfigured() || !hasOrderTokenSecret()) {
    return NextResponse.json({ error: "Checkout isn't connected yet. Please try again soon." }, { status: 503 });
  }

  const parsed = orderRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Please check your details.", field: issue?.path.at(-1) }, { status: 400 });
  }
  const { form, lines, idempotency_key } = parsed.data;

  const adapter = PAYMENT_ADAPTERS[form.payment_method];
  if (!adapter.isAvailable() || !adapter.supportsCountry(form.country)) {
    return NextResponse.json({ error: `${adapter.label} isn't available for this order.`, field: "payment_method" }, { status: 400 });
  }

  const db = serviceClient();
  const { data, error } = await db.rpc("place_order", {
    p: {
      idempotency_key,
      payment_method: form.payment_method,
      shipping_zone_id: zoneFor(form.country, form.delivery_area),
      coupon_code: form.coupon_code || null,
      customer: {
        name: form.name,
        email: form.email,
        phone: toE164(form.phone, form.country),
        country: form.country,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        region: form.region,
        postal_code: form.postal_code,
        notes: form.notes,
      },
      lines: lines.map((l) => ({ product: l.productId, size: l.size, qty: l.qty })),
    },
  });

  if (error) {
    const [code, detail] = (error.message ?? "").split(":");
    if (code === "COUPON") return NextResponse.json({ error: detail, field: "coupon_code" }, { status: 422 });
    if (FRIENDLY[code]) return NextResponse.json({ error: FRIENDLY[code] }, { status: 409 });
    console.error("place_order failed", error);
    return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
  }

  const order = data as { order_id: string; order_number: string; total_bdt: number; duplicate: boolean };
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const token = signOrder(order.order_number);
  const returnUrl = `${origin}/order/${order.order_number}?t=${token}`;

  try {
    // Re-use an existing payment session on a duplicate submit instead of creating a second one.
    if (order.duplicate && adapter.id !== "cod") {
      return NextResponse.json({ next: returnUrl });
    }
    const start = await adapter.start({
      orderId: order.order_id,
      orderNumber: order.order_number,
      totalBDT: order.total_bdt,
      email: form.email,
      returnUrl,
      cancelUrl: `${returnUrl}&cancelled=1`,
    });
    if (start.kind === "redirect") {
      await db.from("payments").update({ provider_ref: start.providerRef }).eq("order_id", order.order_id).eq("provider", adapter.id);
      return NextResponse.json({ next: start.url });
    }
    return NextResponse.json({ next: returnUrl });
  } catch (err) {
    console.error("payment start failed", err);
    // Order exists but payment couldn't start: release the stock right away.
    await db.rpc("cancel_order", { p_order_id: order.order_id, p_reason: "Payment could not be started." });
    return NextResponse.json({ error: "We couldn't start the payment. Your order was not placed — please try another method." }, { status: 502 });
  }
}
