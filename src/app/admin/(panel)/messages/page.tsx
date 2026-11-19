import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHead, when } from "@/components/admin/ui";
import { setMessageStatus } from "./actions";

export const metadata = { title: "Messages" };
const TOPIC: Record<string, string> = { order: "Order", sizing: "Sizing & products", returns: "Returns", wholesale: "Wholesale & press", other: "Other" };
const FILTERS = ["new", "replied", "closed", "all"] as const;

export default async function Messages({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const s = (await searchParams).status;
  const status = FILTERS.includes(s as (typeof FILTERS)[number]) ? (s as (typeof FILTERS)[number]) : "new";
  const db = await userClient();
  let q = db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;

  return (
    <>
      <PageHead
        title="Messages"
        sub="From the Contact page. Reply by email, then mark as replied."
        action={<div className="flex gap-1 rounded-full border border-line bg-ivory p-1">{FILTERS.map((f) => (
          <Link key={f} href={`/admin/messages?status=${f}`} className={`rounded-full px-3 py-1.5 text-xs capitalize ${f === status ? "bg-ink text-ivory" : "text-ink hover:bg-sand"}`}>{f}</Link>
        ))}</div>}
      />
      {error && <Card><p role="alert" className="text-sm text-clay">Couldn&apos;t load messages. Make sure all migrations have been run.</p></Card>}
      {!error && !data?.length && <Card><Empty>No {status === "all" ? "" : status} messages.</Empty></Card>}
      <div className="space-y-4">
        {(data ?? []).map((m) => (
          <Card key={m.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{m.name} <span className="ml-2 text-xs font-normal text-stone">{TOPIC[m.topic] ?? m.topic} · {m.locale === "bn" ? "বাংলা" : "English"}</span></p>
                <p className="mt-0.5 text-sm text-stone">
                  <a className="underline" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to DEMO")}`}>{m.email}</a>
                  {m.phone && <> · <a className="underline" href={`tel:${m.phone}`}>{m.phone}</a></>}
                  {m.order_number && <> · Order <Link className="underline" href={`/admin/orders?q=${m.order_number}`}>{m.order_number}</Link></>}
                </p>
              </div>
              <div className="flex items-center gap-2"><Badge value={m.status === "new" ? "pending" : m.status === "replied" ? "confirmed" : "cancelled"} /><span className="text-xs text-stone">{when(m.created_at)}</span></div>
            </div>
            <p lang={m.locale} className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{m.message}</p>
            <div className="mt-4 flex gap-2">
              {(["replied", "closed", "new"] as const).filter((x) => x !== m.status).map((x) => (
                <form key={x} action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value={x} />
                  <button className="rounded-full border border-ink/20 px-3 py-1.5 text-xs hover:border-ink">Mark {x}</button>
                </form>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
