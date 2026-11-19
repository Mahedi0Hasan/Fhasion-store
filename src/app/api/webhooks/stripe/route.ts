import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog-source";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Configure in the Stripe dashboard for:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired
 * The order is only ever marked paid here, after signature verification,
 * and only if the amount and currency match the stored order (checked in SQL).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isDbConfigured()) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    id: string;
    type: string;
    data: { object: { id: string; payment_status?: string; amount_total?: number; currency?: string } };
  };
  const s = event.data.object;

  let outcome: "paid" | "failed" | "expired" | null = null;
  if (event.type === "checkout.session.completed" && s.payment_status === "paid") outcome = "paid";
  else if (event.type === "checkout.session.async_payment_succeeded") outcome = "paid";
  else if (event.type === "checkout.session.async_payment_failed") outcome = "failed";
  else if (event.type === "checkout.session.expired") outcome = "expired";
  if (!outcome) return NextResponse.json({ received: true, ignored: event.type });

  // A non-BDT charge can never satisfy the amount check; pass null to force a mismatch.
  const amountBDT = s.currency === "bdt" && typeof s.amount_total === "number" ? Math.round(s.amount_total / 100) : null;

  const { data, error } = await serviceClient().rpc("apply_payment_event", {
    p_provider: "stripe",
    p_event_id: event.id,
    p_payload: event,
    p_provider_ref: s.id,
    p_outcome: outcome,
    p_amount_bdt: outcome === "paid" ? amountBDT : null,
  });
  if (error) {
    console.error("apply_payment_event failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 }); // Stripe will retry
  }
  if (data === "failed" || data === "expired") revalidateTag(CATALOG_TAG); // stock was released
  return NextResponse.json({ received: true, result: data });
}
