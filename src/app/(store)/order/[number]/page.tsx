import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatBDT } from "@/lib/catalog";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { hasOrderTokenSecret, verifyOrder } from "@/lib/order-token";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; cancelled?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t, cancelled } = await searchParams;
  if (!isDbConfigured() || !hasOrderTokenSecret() || !/^DM-\d{6}-[0-9A-F]{6}$/.test(number) || !verifyOrder(number, t)) notFound();

  const { data: o } = await serviceClient()
    .from("orders")
    .select("order_number,status,payment_method,payment_status,customer_name,email,phone,address_line1,address_line2,city,region,country,subtotal_bdt,discount_bdt,shipping_bdt,total_bdt,coupon_code,created_at,order_items(product_name,colour,size,quantity,line_total_bdt)")
    .eq("order_number", number)
    .single();
  if (!o) notFound();

  const paid = o.payment_status === "paid";
  const isCod = o.payment_method === "cod";
  const failed = o.status === "cancelled" || cancelled === "1";
  const state = failed && !paid
    ? { Icon: XCircle, title: "Payment not completed", body: "Your payment wasn't completed, so this order hasn't gone through. Nothing was charged. You can return to the shop and try again." }
    : isCod
      ? { Icon: CheckCircle2, title: "Thank you, your order is in.", body: "We'll call you shortly to confirm, then pass it to the courier. Pay in cash on delivery." }
      : paid
        ? { Icon: CheckCircle2, title: "Thank you, payment received.", body: "Your order is confirmed. We'll email you when it ships." }
        : { Icon: Clock, title: "Confirming your payment…", body: "This usually takes a few seconds. Refresh the page in a moment. You'll also get an email once it's confirmed." };

  return (
    <div className="container-x max-w-4xl py-14 md:py-20">
      <state.Icon className={`size-10 ${failed && !paid ? "text-clay" : "text-ink"}`} strokeWidth={1.25} />
      <h1 className="mt-5 font-serif text-5xl leading-none text-ink md:text-6xl">{state.title}</h1>
      <p className="mt-4 max-w-xl text-stone">{state.body}</p>

      <div className="mt-10 grid gap-8 rounded-[2px] bg-ivory p-6 md:grid-cols-2 md:p-8">
        <div>
          <p className="label text-stone">Order number</p>
          <p className="mt-1 font-serif text-3xl tracking-wide text-ink">{o.order_number}</p>
          <p className="mt-1 text-xs text-stone">Keep this with your phone number to track your order.</p>
          <p className="label mt-6 text-stone">Delivering to</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            {o.customer_name}<br />
            {o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}<br />
            {o.city}{o.region ? `, ${o.region}` : ""}, {o.country}<br />
            {o.phone}
          </p>
        </div>
        <div>
          <ul className="divide-y divide-line text-sm">
            {o.order_items.map((it: { product_name: string; colour: string; size: string; quantity: number; line_total_bdt: number }, i: number) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span className="text-ink">{it.product_name} <span className="text-stone">· {it.colour} · {it.size} × {it.quantity}</span></span>
                <span className="shrink-0 whitespace-nowrap">{formatBDT(it.line_total_bdt)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{formatBDT(o.subtotal_bdt)}</dd></div>
            {o.discount_bdt > 0 && <div className="flex justify-between"><dt className="text-stone">Discount ({o.coupon_code})</dt><dd className="text-clay">− {formatBDT(o.discount_bdt)}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone">Delivery</dt><dd>{o.shipping_bdt === 0 ? "Free" : formatBDT(o.shipping_bdt)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-medium">Total</dt><dd className="font-serif text-2xl">{formatBDT(o.total_bdt)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/track-order" className="inline-flex h-12 items-center rounded-full bg-ink px-7 text-sm font-medium text-ivory">Track this order</Link>
        <Link href="/shop" className="inline-flex h-12 items-center rounded-full border border-ink/20 px-7 text-sm font-medium text-ink hover:border-ink">Continue shopping</Link>
      </div>
    </div>
  );
}
