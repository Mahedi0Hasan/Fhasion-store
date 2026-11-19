import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { orderRequestSchema, toE164, zoneFor } from "@/lib/validation/checkout";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { hasOrderTokenSecret, signOrder } from "@/lib/order-token";
import { PAYMENT_ADAPTERS } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/read-json";
import { getI18n } from "@/lib/i18n/server";
import { translateMessage } from "@/lib/i18n";
import { localizeCouponError } from "@/lib/i18n/coupon";

const FRIENDLY = new Set(["OUT_OF_STOCK", "UNKNOWN_ITEM", "INVALID_QTY", "INVALID_ZONE", "COD_BD_ONLY", "EMPTY_CART"]);

export async function POST(req: Request) {
  const { t, dict, bdt: money } = await getI18n();
  const ip = clientIp(req.headers);
  if (!(await rateLimit(`order:${ip}`, 5, 60_000)).ok) {
    return NextResponse.json({ error: t("err.rate") }, { status: 429 });
  }
  if (!isDbConfigured() || !hasOrderTokenSecret()) {
    return NextResponse.json({ error: t("err.notConnected") }, { status: 503 });
  }

  const parsed = orderRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: translateMessage(dict, issue?.message) || t("err.check"), field: issue?.path.at(-1) }, { status: 400 });
  }
  const { form, lines, idempotency_key } = parsed.data;

  const adapter = PAYMENT_ADAPTERS[form.payment_method];
  if (!adapter.isAvailable() || !adapter.supportsCountry(form.country)) {
    return NextResponse.json({ error: t("err.methodUnavailable", { method: t(`checkout.methods.${adapter.id}.label`) }), field: "payment_method" }, { status: 400 });
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
    if (code === "COUPON") return NextResponse.json({ error: localizeCouponError(detail, t, money), field: "coupon_code" }, { status: 422 });
    if (FRIENDLY.has(code)) return NextResponse.json({ error: t(`err.${code}`) }, { status: 409 });
    console.error("place_order failed", error);
    return NextResponse.json({ error: t("err.placeFailed") }, { status: 500 });
  }

  const order = data as { order_id: string; order_number: string; total_bdt: number; duplicate: boolean };
  // Stock just changed: refresh the cached catalogue so sizes show the right availability.
  if (!order.duplicate) revalidateTag(CATALOG_TAG);
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
    revalidateTag(CATALOG_TAG);
    return NextResponse.json({ error: t("err.payStart") }, { status: 502 });
  }
}

