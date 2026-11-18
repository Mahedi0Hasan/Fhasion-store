import Link from "next/link";
import { notFound } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { Badge, Card, PageHead, money, when } from "@/components/admin/ui";
import { StatusForm } from "./status-form";

export const metadata = { title: "Order" };

const NEXT: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await userClient();
  const { data: o } = await db
    .from("orders")
    .select("*, order_items(*), order_events(status,note,created_at), payments(provider,status,amount_bdt,provider_ref,created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!o) notFound();

  const options = NEXT[o.status].filter((s) => s !== "refunded" || o.payment_status === "paid");

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-stone hover:text-ink">← Orders</Link>
      <PageHead title={o.order_number} sub={`Placed ${when(o.created_at)}`} action={<div className="flex gap-2"><Badge value={o.status} /><Badge value={o.payment_status} /></div>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Items">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {o.order_items.map((it: { id: string; product_name: string; colour: string; size: string; sku: string; quantity: number; unit_price_bdt: number; line_total_bdt: number }) => (
                  <tr key={it.id}>
                    <td className="py-2.5">{it.product_name}<div className="text-xs text-stone">{it.colour} · {it.size} · {it.sku}</div></td>
                    <td className="py-2.5 text-right text-stone">{it.quantity} × {money(it.unit_price_bdt)}</td>
                    <td className="py-2.5 text-right">{money(it.line_total_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{money(o.subtotal_bdt)}</dd></div>
              {o.discount_bdt > 0 && <div className="flex justify-between"><dt className="text-stone">Discount ({o.coupon_code})</dt><dd>− {money(o.discount_bdt)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone">Delivery ({o.shipping_zone_id})</dt><dd>{money(o.shipping_bdt)}</dd></div>
              <div className="flex justify-between font-medium"><dt>Total</dt><dd>{money(o.total_bdt)}</dd></div>
            </dl>
          </Card>
          <Card title="History">
            <ol className="space-y-3 text-sm">
              {[...o.order_events].sort((a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at)).map((e: { status: string; note: string | null; created_at: string }, i: number) => (
                <li key={i} className="flex gap-4"><span className="w-28 shrink-0 text-xs text-stone">{when(e.created_at)}</span><span><Badge value={e.status} /> {e.note && <span className="ml-1 text-stone">{e.note}</span>}</span></li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Update status">
            {options.length === 0 ? <p className="text-sm text-stone">This order is closed.</p> : (
              <StatusForm id={o.id} options={options} courier={o.courier} tracking={o.tracking_number} />
            )}
          </Card>
          <Card title="Customer">
            <p className="text-sm">{o.customer_name}</p>
            <p className="text-sm"><a className="underline" href={`tel:${o.phone}`}>{o.phone}</a></p>
            <p className="text-sm"><a className="underline" href={`mailto:${o.email}`}>{o.email}</a></p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}<br />{o.city}{o.region ? `, ${o.region}` : ""} {o.postal_code ?? ""}<br />{o.country}
            </p>
            {o.notes && <p className="mt-3 rounded-[2px] bg-sand px-3 py-2 text-sm">“{o.notes}”</p>}
          </Card>
          <Card title="Payment">
            {o.payments.map((p: { provider: string; status: string; amount_bdt: number; provider_ref: string | null }, i: number) => (
              <div key={i} className="text-sm">
                <p><span className="uppercase">{p.provider}</span> · <Badge value={p.status} /> · {money(p.amount_bdt)}</p>
                {p.provider_ref && <p className="mt-1 break-all text-xs text-stone">Ref: {p.provider_ref}</p>}
              </div>
            ))}
            {o.courier && <p className="mt-3 text-sm">Courier: {o.courier} · {o.tracking_number}</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
