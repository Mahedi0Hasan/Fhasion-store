import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { userClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/catalog-source";
import { Card, Empty, PageHead, btn, btnGhost, field, money, td, th } from "@/components/admin/ui";

export const metadata = { title: "Products" };

type Row = {
  id: string; name: string; slug: string; colour: string; price_bdt: number; sale_price_bdt: number | null; is_active: boolean;
  category: { name: string } | null; product_images: { src: string; sort: number }[];
  product_variants: { inventory: { quantity: number } | null }[];
};

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60).replace(/[,()*%\\]/g, " ").trim();
  const db = await userClient();
  let query = db.from("products")
    .select("id,name,slug,colour,price_bdt,sale_price_bdt,is_active,category:categories(name),product_images(src,sort),product_variants(inventory(quantity))")
    .order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,colour.ilike.%${q}%`);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead title="Products" sub={`${rows.length} shown`} action={<Link href="/admin/products/new" className={btn}><Plus className="size-4" /> New product</Link>} />
      {sp.deleted && <p role="status" className="mb-4 text-sm text-emerald-800">Product deleted.</p>}
      <form className="mb-5 flex gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search products" className={`${field} max-w-xs`} />
        <button className={btnGhost}>Search</button>
      </form>
      <Card>
        {!rows.length ? <Empty>No products yet.</Empty> : (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="w-full min-w-[46rem]">
              <thead className="border-b border-line"><tr><th className={th}></th><th className={th}>Product</th><th className={th}>Category</th><th className={`${th} text-right`}>Price</th><th className={`${th} text-right`}>Stock</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => {
                  const img = [...p.product_images].sort((a, b) => a.sort - b.sort)[0];
                  const stock = p.product_variants.reduce((a, v) => a + (v.inventory?.quantity ?? 0), 0);
                  return (
                    <tr key={p.id} className="hover:bg-cream/50">
                      <td className="w-16 py-2 pl-3">
                        <div className="relative size-12 overflow-hidden rounded-[2px] bg-sand">
                          {img && <Image src={imageUrl(img.src)} alt="" fill sizes="48px" className="object-cover" />}
                        </div>
                      </td>
                      <td className={td}><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link><div className="text-xs text-stone">{p.colour} · /{p.slug}</div></td>
                      <td className={td}>{p.category?.name ?? "—"}</td>
                      <td className={`${td} text-right`}>{p.sale_price_bdt ? <><span className="text-clay">{money(p.sale_price_bdt)}</span> <s className="text-xs text-stone">{money(p.price_bdt)}</s></> : money(p.price_bdt)}</td>
                      <td className={`${td} text-right ${stock === 0 ? "text-clay" : ""}`}>{stock}</td>
                      <td className={td}>{p.is_active ? <span className="text-emerald-800">Live</span> : <span className="text-stone">Hidden</span>}</td>
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
