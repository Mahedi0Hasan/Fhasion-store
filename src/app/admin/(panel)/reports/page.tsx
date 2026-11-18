import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Card, Empty, PageHead, Stat, money } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";

export const metadata = { title: "Reports" };
const RANGES = [7, 30, 90, 365];

export default async function Reports({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const db = await userClient();
  const [{ data: dash, error }, { data: orders }] = await Promise.all([
    db.rpc("staff_dashboard", { p_days: days }),
    db.from("orders").select("status,payment_method,shipping_zone_id,total_bdt,discount_bdt").gte("created_at", since).limit(10000),
  ]);
  if (error || !dash) return <><PageHead title="Sales reports" /><Card><p role="alert" className="text-sm text-clay">Couldn&apos;t load report data. Make sure all migrations have been run.</p></Card></>;
  const list = orders ?? [];
  const live = list.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const revenue = live.reduce((a, o) => a + o.total_bdt, 0);
  const discounts = live.reduce((a, o) => a + o.discount_bdt, 0);
  const group = (key: "status" | "payment_method" | "shipping_zone_id", rows = list) =>
    Object.entries(rows.reduce<Record<string, { n: number; v: number }>>((m, o) => {
      const k = o[key]; m[k] ??= { n: 0, v: 0 }; m[k].n++; m[k].v += o.total_bdt; return m;
    }, {})).sort((a, b) => b[1].n - a[1].n);
  const daily = (dash as { daily: { day: string; revenue_bdt: number; orders: number }[] }).daily;
  const top = (dash as { top_products: { name: string; units: number; revenue_bdt: number }[] }).top_products;

  return (
    <>
      <PageHead
        title="Sales reports"
        sub="Revenue counts every order except cancelled and refunded ones."
        action={<div className="flex gap-1 rounded-full border border-line bg-ivory p-1">{RANGES.map((r) => (
          <Link key={r} href={`/admin/reports?days=${r}`} className={`rounded-full px-3 py-1.5 text-xs ${r === days ? "bg-ink text-ivory" : "text-ink hover:bg-sand"}`}>{r === 365 ? "1 year" : `${r} days`}</Link>
        ))}</div>}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={money(revenue)} />
        <Stat label="Orders" value={String(live.length)} hint={`${list.length - live.length} cancelled/refunded`} />
        <Stat label="Average order" value={money(live.length ? Math.round(revenue / live.length) : 0)} />
        <Stat label="Discounts given" value={money(discounts)} />
      </div>
      <Card title="Daily revenue" className="mt-6"><SalesChart data={daily} /></Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Breakdown title="Top products" rows={top.map((t) => [t.name, `${t.units} sold`, money(t.revenue_bdt)])} />
        <Breakdown title="By payment method" rows={group("payment_method", live).map(([k, v]) => [k.toUpperCase(), `${v.n} orders`, money(v.v)])} />
        <Breakdown title="By delivery zone" rows={group("shipping_zone_id", live).map(([k, v]) => [k, `${v.n} orders`, money(v.v)])} />
        <Breakdown title="By status" rows={group("status").map(([k, v]) => [k, `${v.n} orders`, money(v.v)])} />
      </div>
    </>
  );
}

function Breakdown({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <Empty>No data in this range.</Empty> : (
        <ul className="space-y-2.5 text-sm">
          {rows.map(([a, b, c]) => <li key={a} className="flex justify-between gap-3"><span className="capitalize">{a}</span><span className="text-right text-stone">{b} · <span className="text-ink">{c}</span></span></li>)}
        </ul>
      )}
    </Card>
  );
}
