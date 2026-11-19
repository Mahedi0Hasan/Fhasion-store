import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { hasOrderTokenSecret, verifyOrder } from "@/lib/order-token";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("order.meta"), robots: { index: false, follow: false } };
}
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; cancelled?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t: token, cancelled } = await searchParams;
  const { t, bdt: formatBDT } = await getI18n();
  if (!isDbConfigured() || !hasOrderTokenSecret() || !/^DM-\d{6}-[0-9A-F]{6}$/.test(number) || !verifyOrder(number, token)) notFound();

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
    ? { Icon: XCircle, title: t("order.failedTitle"), body: t("order.failedBody") }
    : isCod
      ? { Icon: CheckCircle2, title: t("order.codTitle"), body: t("order.codBody") }
      : paid
        ? { Icon: CheckCircle2, title: t("order.paidTitle"), body: t("order.paidBody") }
        : { Icon: Clock, title: t("order.waitTitle"), body: t("order.waitBody") };

  return (
    <div className="container-x max-w-4xl py-14 md:py-20">
      <state.Icon className={`size-10 ${failed && !paid ? "text-clay" : "text-ink"}`} strokeWidth={1.25} />
      <h1 className="mt-5 font-serif text-5xl leading-none text-ink md:text-6xl">{state.title}</h1>
      <p className="mt-4 max-w-xl text-stone">{state.body}</p>

      <div className="mt-10 grid gap-8 rounded-[2px] bg-ivory p-6 md:grid-cols-2 md:p-8">
        <div>
          <p className="label text-stone">{t("order.number")}</p>
          <p className="mt-1 font-serif text-3xl tracking-wide text-ink">{o.order_number}</p>
          <p className="mt-1 text-xs text-stone">{t("order.keep")}</p>
          <p className="label mt-6 text-stone">{t("order.deliveringTo")}</p>
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
            <div className="flex justify-between"><dt className="text-stone">{t("cart.subtotal")}</dt><dd>{formatBDT(o.subtotal_bdt)}</dd></div>
            {o.discount_bdt > 0 && <div className="flex justify-between"><dt className="text-stone">{t("cart.discount", { code: o.coupon_code })}</dt><dd className="text-clay">− {formatBDT(o.discount_bdt)}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone">{t("checkout.delivery")}</dt><dd>{o.shipping_bdt === 0 ? t("cart.free") : formatBDT(o.shipping_bdt)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-medium">{t("checkout.total")}</dt><dd className="font-serif text-2xl">{formatBDT(o.total_bdt)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/track-order" className="inline-flex h-12 items-center rounded-full bg-ink px-7 text-sm font-medium text-ivory">{t("order.track")}</Link>
        <Link href="/shop" className="inline-flex h-12 items-center rounded-full border border-ink/20 px-7 text-sm font-medium text-ink hover:border-ink">{t("cart.continue")}</Link>
      </div>
    </div>
  );
}
