import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHead, Stat, money, td, th, when } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";

type Dash = {
  revenue_bdt: number; orders: number; open_orders: number; customers: number; products: number;
  daily: { day: string; revenue_bdt: number; orders: number }[];
  low_stock: { product: string; product_id: string; size: string; sku: string; quantity: number }[];
  top_products: { name: string; units: number; revenue_bdt: number }[];
};

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const db = await userClient();
  const [{ data: dash, error }, { data: recent }] = await Promise.all([
    db.rpc("staff_dashboard", { p_days: 30 }),
    db.from("orders").select("id,order_number,customer_name,total_bdt,status,payment_method,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  if (error || !dash) {
    return (<><PageHead title="Overview" /><Card><p role="alert" className="text-sm text-clay">Couldn&apos;t load dashboard numbers. Make sure all migrations in <code>supabase/migrations</code> have been run.</p></Card></>);
  }
  const d = dash as Dash;
  const last30 = d.daily.reduce((a, x) => a + x.revenue_bdt, 0);

  return (
    <>
      {(await searchParams).denied && <p role="alert" className="mb-6 rounded-[2px] bg-clay/10 px-4 py-3 text-sm text-clay">That page is for admins only.</p>}
      <PageHead title="Overview" sub="Revenue excludes cancelled and refunded orders." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Total revenue" value={money(d.revenue_bdt)} hint={`${money(last30)} in the last 30 days`} />
        <Stat label="Total orders" value={String(d.orders)} hint={`${d.open_orders} open`} />
        <Stat label="Customers" value={String(d.customers)} hint="Unique phone numbers" />
        <Stat label="Products" value={String(d.products)} />
        <Stat label="Low stock" value={String(d.low_stock.length)} hint="Variants at or under threshold" />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <Card title="Sales, last 30 days" className="xl:col-span-2">
          <SalesChart data={d.daily} />
        </Card>
        <Card title="Low-stock alerts" action={<Link href="/admin/inventory" className="text-xs underline">Inventory</Link>}>
          {d.low_stock.length === 0 ? <Empty>All stocked up.</Empty> : (
            <ul className="divide-y divide-line text-sm">
              {d.low_stock.map((l) => (
                <li key={l.sku} className="flex items-center justify-between py-2">
                  <Link href={`/admin/products/${l.product_id}`} className="hover:underline">{l.product} <span className="text-stone">· {l.size}</span></Link>
                  <span className={l.quantity === 0 ? "font-medium text-clay" : "text-ink"}>{l.quantity === 0 ? "Sold out" : `${l.quantity} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-xs underline">All orders</Link>} className="xl:col-span-2">
          {!recent?.length ? <Empty>No orders yet.</Empty> : (
            <div className="-mx-3 overflow-x-auto">
              <table className="w-full min-w-[34rem]">
                <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th><th className={th}>Placed</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.order_number}</Link></td>
                      <td className={td}>{o.customer_name}</td>
                      <td className={td}><Badge value={o.status} /></td>
                      <td className={`${td} text-right`}>{money(o.total_bdt)}</td>
                      <td className={`${td} text-stone`}>{when(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Top products">
          {d.top_products.length === 0 ? <Empty>No sales yet.</Empty> : (
            <ol className="space-y-3 text-sm">
              {d.top_products.map((t, i) => (
                <li key={t.name} className="flex justify-between gap-3"><span><span className="mr-2 text-stone">{i + 1}.</span>{t.name}</span><span className="text-stone">{t.units} sold</span></li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
