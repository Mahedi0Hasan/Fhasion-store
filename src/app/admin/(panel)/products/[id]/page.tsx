import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { userClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/catalog-source";
import { Card, PageHead, btnGhost } from "@/components/admin/ui";
import { ProductForm } from "../product-form";
import { deleteProduct, imageAction } from "../actions";
import { AddVariantForm, StockRow, UploadForm } from "./editors";
import { ConfirmButton } from "./confirm-button";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await userClient();
  const [{ data: p }, { data: categories }] = await Promise.all([
    db.from("products").select("*, product_images(id,src,alt,fit,sort), product_variants(id,size,sku,is_active,inventory(quantity,low_stock_threshold))").eq("id", id).maybeSingle(),
    db.from("categories").select("id,name").order("sort"),
  ]);
  if (!p) notFound();
  const images = [...p.product_images].sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort);
  const variants = [...p.product_variants].sort((a: { size: string }, b: { size: string }) => a.size.localeCompare(b.size, undefined, { numeric: true }));

  return (
    <>
      <Link href="/admin/products" className="text-sm text-stone hover:text-ink">← Products</Link>
      <PageHead
        title={p.name}
        sub={p.is_active ? "Visible in the store" : "Hidden from the store"}
        action={p.is_active ? <Link href={`/product/${p.slug}`} target="_blank" className={btnGhost}>View in store <ArrowUpRight className="size-4" /></Link> : undefined}
      />
      {(await searchParams).created && <p role="status" className="mb-4 text-sm text-emerald-800">Product created. Now add sizes and photos, then tick “Visible in store”.</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title="Details">
          <ProductForm categories={categories ?? []} values={{ ...p, details: p.details ?? [] }} />
        </Card>
        <div className="space-y-6">
          <Card title="Sizes & stock">
            {variants.length === 0 && <p className="mb-3 text-sm text-clay">No sizes yet. Customers can&apos;t buy this until you add one.</p>}
            <div className="space-y-2">
              {variants.map((v: { id: string; size: string; sku: string; is_active: boolean; inventory: { quantity: number; low_stock_threshold: number } | null }) => (
                <StockRow key={v.id} productId={p.id} variant={{ id: v.id, size: v.size, sku: v.sku, is_active: v.is_active, quantity: v.inventory?.quantity ?? 0 }} />
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-4"><AddVariantForm productId={p.id} /></div>
          </Card>
          <Card title="Photos">
            <ul className="grid grid-cols-3 gap-2">
              {images.map((im: { id: string; src: string; fit: string }, i: number) => (
                <li key={im.id} className="group relative aspect-[4/5] overflow-hidden rounded-[2px] bg-sand">
                  <Image src={imageUrl(im.src)} alt="" fill sizes="120px" className={im.fit === "contain" ? "object-contain p-1" : "object-cover"} />
                  {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-ink px-1.5 text-[0.6rem] text-ivory">Main</span>}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    {i > 0 && <form action={imageAction}><input type="hidden" name="id" value={im.id} /><input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="op" value="first" /><button className="rounded-full bg-ivory px-1.5 text-[0.6rem]">Main</button></form>}
                    <form action={imageAction}><input type="hidden" name="id" value={im.id} /><input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="op" value="fit" /><button className="rounded-full bg-ivory px-1.5 text-[0.6rem]">{im.fit === "contain" ? "Fill" : "Fit"}</button></form>
                    <form action={imageAction}><input type="hidden" name="id" value={im.id} /><input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="op" value="delete" /><button aria-label="Delete photo" className="rounded-full bg-ivory p-0.5"><Trash2 className="size-3" /></button></form>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4"><UploadForm productId={p.id} /></div>
          </Card>
          <Card title="Danger zone">
            <p className="mb-3 text-sm text-stone">Deleting removes the product, its sizes and photos. Past orders keep their own copy of the details. To hide it temporarily, untick “Visible in store” instead.</p>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmButton message={`Delete "${p.name}" permanently?`}>Delete product</ConfirmButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
