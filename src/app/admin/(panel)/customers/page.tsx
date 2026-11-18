import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Card, Empty, PageHead, Pager, btnGhost, field, money, td, th, when } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const PAGE = 25;

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60).replace(/[,()*%\\]/g, " ").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await userClient();
  let query = db.from("staff_customers").select("*", { count: "exact" }).order("last_order_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q.replace(/^0/, "")}%,email.ilike.%${q}%`);
  const { data, count } = await query;

  return (
    <>
      <PageHead title="Customers" sub="Guest checkout, so customers are grouped by phone number." />
      <form className="mb-5 flex gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Name, phone or email" className={`${field} max-w-xs`} />
        <button className={btnGhost}>Search</button>
      </form>
      <Card>
        {!data?.length ? <Empty>No customers yet.</Empty> : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line"><tr><th className={th}>Customer</th><th className={th}>Phone</th><th className={th}>City</th><th className={`${th} text-right`}>Orders</th><th className={`${th} text-right`}>Spent</th><th className={th}>Last order</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.map((c) => (
                  <tr key={c.phone}>
                    <td className={td}>{c.name}<div className="text-xs text-stone">{c.email}</div></td>
                    <td className={td}><Link className="hover:underline" href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}>{c.phone}</Link></td>
                    <td className={td}>{c.city}, {c.country}</td>
                    <td className={`${td} text-right`}>{c.orders}</td>
                    <td className={`${td} text-right`}>{money(c.spent_bdt)}</td>
                    <td className={`${td} text-stone`}>{when(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Pager page={page} pages={Math.max(1, Math.ceil((count ?? 0) / PAGE))} href={(p) => `/admin/customers?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`} />
    </>
  );
}
