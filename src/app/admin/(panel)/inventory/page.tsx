import Link from "next/link";
import { userClient } from "@/lib/supabase/server";
import { Card, Empty, PageHead, btnGhost } from "@/components/admin/ui";
import { StockRow } from "../products/[id]/editors";

export const metadata = { title: "Inventory" };

type P = { id: string; name: string; colour: string; product_variants: { id: string; size: string; sku: string; is_active: boolean; inventory: { quantity: number; low_stock_threshold: number } | null }[] };

export default async function Inventory({ searchParams }: { searchParams: Promise<{ low?: string }> }) {
  const low = (await searchParams).low === "1";
  const db = await userClient();
  const { data } = await db.from("products").select("id,name,colour,product_variants(id,size,sku,is_active,inventory(quantity,low_stock_threshold))").order("name");
  const products = ((data ?? []) as unknown as P[])
    .map((p) => ({ ...p, product_variants: p.product_variants.filter((v) => !low || (v.inventory?.quantity ?? 0) <= (v.inventory?.low_stock_threshold ?? 3)) }))
    .filter((p) => p.product_variants.length > 0);
  const units = products.reduce((a, p) => a + p.product_variants.reduce((b, v) => b + (v.inventory?.quantity ?? 0), 0), 0);

  return (
    <>
      <PageHead
        title="Inventory"
        sub={`${units} units across ${products.length} products${low ? " (low stock only)" : ""}`}
        action={<Link href={low ? "/admin/inventory" : "/admin/inventory?low=1"} className={btnGhost}>{low ? "Show all" : "Low stock only"}</Link>}
      />
      {products.length === 0 ? <Card><Empty>{low ? "Nothing is running low." : "No sizes set up yet."}</Empty></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} title={`${p.name} · ${p.colour}`} action={<Link href={`/admin/products/${p.id}`} className="text-xs underline">Edit</Link>}>
              <div className="space-y-2">
                {p.product_variants.sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true })).map((v) => (
                  <StockRow key={v.id} productId={p.id} variant={{ id: v.id, size: v.size, sku: v.sku, is_active: v.is_active, quantity: v.inventory?.quantity ?? 0 }} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
