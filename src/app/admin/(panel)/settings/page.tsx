import { requireAdmin } from "@/lib/admin/auth";
import { userClient } from "@/lib/supabase/server";
import { paymentOptions } from "@/lib/payments";
import { Card, PageHead } from "@/components/admin/ui";
import { UsdRateForm, ZoneForm } from "../manage-forms";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireAdmin();
  const db = await userClient();
  const [{ data: zones }, { data: staff }, { data: rateRow }] = await Promise.all([
    db.from("shipping_zones").select("id,label,fee_bdt,free_over_bdt,eta").order("sort"),
    db.from("profiles").select("id,full_name,role").not("role", "is", null),
    db.from("store_settings").select("value,updated_at").eq("key", "usd_rate").maybeSingle(),
  ]);
  const rate = Number((rateRow?.value as { bdt_per_usd?: number } | undefined)?.bdt_per_usd) || null;
  return (
    <>
      <PageHead title="Store settings" sub="Admins only." />
      <Card title="Delivery fees" className="mb-6">
        <div className="space-y-5">{(zones ?? []).map((z) => <ZoneForm key={z.id} z={z} />)}</div>
      </Card>
      <Card title="USD display rate" className="mb-6">
        <p className="mb-4 max-w-2xl text-sm text-stone">Shoppers can switch prices to US dollars. The rate below is used <strong>for display only</strong>. Every order is still charged in taka. Update it when the market rate moves.{rateRow?.updated_at ? ` Last changed ${new Date(rateRow.updated_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}.` : ""}</p>
        <UsdRateForm rate={rate} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Payment methods">
          <ul className="space-y-2 text-sm">
            {paymentOptions().map((p) => (
              <li key={p.id} className="flex justify-between gap-3"><span>{p.label}</span><span className={p.available ? "text-emerald-800" : "text-stone"}>{p.available ? "Active" : "Not configured"}</span></li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-stone">Payment keys are set as server environment variables (see README), never in the dashboard.</p>
        </Card>
        <Card title="Team">
          <ul className="space-y-2 text-sm">
            {(staff ?? []).map((s) => <li key={s.id} className="flex justify-between"><span>{s.full_name ?? s.id.slice(0, 8)}</span><span className="capitalize text-stone">{s.role}</span></li>)}
          </ul>
          <p className="mt-4 text-xs text-stone">To add someone: create the user in Supabase → Authentication, then set their role in the <code>profiles</code> table to <code>staff</code> or <code>admin</code>.</p>
        </Card>
      </div>
    </>
  );
}
