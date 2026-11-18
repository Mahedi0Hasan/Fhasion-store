import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentAdapter } from "./types";

/**
 * Stripe Checkout (hosted page). Charges in BDT — the same amount the order
 * stores — so there is no display-vs-charge currency mismatch.
 * Merchant eligibility: Stripe does not onboard Bangladesh-registered
 * businesses directly; you need an entity in a supported country.
 */
const API = "https://api.stripe.com/v1";

export const stripeAdapter: PaymentAdapter = {
  id: "stripe",
  label: "Card (Visa, Mastercard, Amex)",
  description: "Secure card payment via Stripe.",
  isAvailable: () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  supportsCountry: () => true,
  async start(order) {
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "bdt",
      "line_items[0][price_data][unit_amount]": String(order.totalBDT * 100), // poisha
      "line_items[0][price_data][product_data][name]": `DEMO order ${order.orderNumber}`,
      customer_email: order.email,
      client_reference_id: order.orderNumber,
      "metadata[order_number]": order.orderNumber,
      success_url: order.returnUrl,
      cancel_url: order.cancelUrl,
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60),
    });
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `order-${order.orderNumber}`,
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Stripe error: ${data?.error?.message ?? res.status}`);
    return { kind: "redirect", url: data.url, providerRef: data.id };
  },
};

/** Verify a Stripe-Signature header (v1 scheme) against the raw body. */
export function verifyStripeSignature(raw: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]).filter((p) => p.length === 2)) as Record<string, string>;
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
