import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHead, Pager, btnGhost, field, money, td, th, when } from "@/components/admin/ui";

export const metadata = { title: "Orders" };
const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
const PAGE = 20;

type SP = Promise<{ q?: string; status?: string; page?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const db = await userClient();
  let query = db
    .from("orders")
    .select("id,order_number,customer_name,phone,city,country,total_bdt,status,payment_method,payment_status,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (status) query = query.eq("status", status);
  if (q) {
    // Escape PostgREST filter syntax characters before building the OR filter.
    const safe = q.replace(/[,()*%\\]/g, " ").trim();
    if (safe) query = query.or(`order_number.ilike.%${safe}%,customer_name.ilike.%${safe}%,phone.ilike.%${safe.replace(/^0/, "")}%,email.ilike.%${safe}%`);
  }
  const { data: orders, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHead title="Orders" sub={`${count ?? 0} ${status ? status : "total"}`} />
      <form className="mb-5 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Order no., name, phone or email" className={`${field} max-w-xs`} />
        <select name="status" defaultValue={status ?? ""} className={`${field} w-auto`}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className={btnGhost}>Filter</button>
        {(q || status) && <Link href="/admin/orders" className="self-center text-sm text-stone underline">Clear</Link>}
      </form>
      <Card>
        {!orders?.length ? <Empty>No orders match.</Empty> : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead className="border-b border-line"><tr>
                <th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Destination</th><th className={th}>Payment</th>
                <th className={th}>Status</th><th className={`${th} text-right`}>Total</th><th className={th}>Placed</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/50">
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.order_number}</Link></td>
                    <td className={td}>{o.customer_name}<div className="text-xs text-stone">{o.phone}</div></td>
                    <td className={td}>{o.city}, {o.country}</td>
                    <td className={td}><span className="uppercase">{o.payment_method}</span> <Badge value={o.payment_status} /></td>
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
      <Pager page={page} pages={pages} href={href} />
    </>
  );
}
