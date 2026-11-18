import { userClient } from "@/lib/supabase/server";
import { Card, Empty, PageHead, money, td, th } from "@/components/admin/ui";
import { CouponForm } from "../manage-forms";
import { toggleCoupon } from "../manage-actions";

export const metadata = { title: "Coupons" };

export default async function Coupons() {
  const db = await userClient();
  const { data } = await db.from("coupons").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHead title="Coupons" sub="Discounts are always recalculated on the server at checkout." />
      <Card title="New coupon" className="mb-6 max-w-3xl"><CouponForm /></Card>
      <Card>
        {!data?.length ? <Empty>No coupons yet.</Empty> : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[44rem]">
              <thead className="border-b border-line"><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Min. spend</th><th className={th}>Used</th><th className={th}>Expires</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.map((c) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  return (
                    <tr key={c.id}>
                      <td className={`${td} font-medium`}>{c.code}</td>
                      <td className={td}>{c.kind === "percent" ? `${c.value}%` : money(c.value)}{c.max_discount_bdt ? <span className="text-xs text-stone"> (max {money(c.max_discount_bdt)})</span> : null}</td>
                      <td className={td}>{c.min_subtotal_bdt ? money(c.min_subtotal_bdt) : "—"}</td>
                      <td className={td}>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                      <td className={`${td} ${expired ? "text-clay" : ""}`}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-GB") : "Never"}</td>
                      <td className={td}>
                        <form action={toggleCoupon}>
                          <input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(c.is_active)} />
                          <button className={`rounded-full px-3 py-1 text-xs ${c.is_active ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{c.is_active ? "Active · pause" : "Paused · resume"}</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
