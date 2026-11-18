"use client";

import { useActionState } from "react";
import { ActionMsg, btn, btnGhost, field } from "@/components/admin/ui";
import { addVariant, updateStock, uploadImages } from "../actions";

export function StockRow({ productId, variant }: { productId: string; variant: { id: string; size: string; sku: string; is_active: boolean; quantity: number } }) {
  const [state, action, pending] = useActionState(updateStock, {});
  return (
    <form action={action} className="grid grid-cols-[3rem_1fr_5rem_auto] items-center gap-2 text-sm">
      <input type="hidden" name="variant_id" value={variant.id} />
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="is_active_present" value="1" />
      <span className="font-medium">{variant.size}</span>
      <span className="truncate text-xs text-stone" title={variant.sku}>
        <label className="mr-2 inline-flex items-center gap-1"><input type="checkbox" name="is_active" defaultChecked={variant.is_active} className="accent-[var(--color-ink)]" /> on sale</label>
        {variant.sku}
      </span>
      <input name="quantity" type="number" min={0} step={1} defaultValue={variant.quantity} aria-label={`Stock for size ${variant.size}`} className={`${field} h-9 ${variant.quantity === 0 ? "border-clay/50 text-clay" : ""}`} />
      <button disabled={pending} className="h-9 rounded-full border border-ink/20 px-3 text-xs hover:border-ink">{pending ? "…" : "Save"}</button>
      {(state.error || state.ok) && <div className="col-span-4"><ActionMsg state={state} /></div>}
    </form>
  );
}

export function AddVariantForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(addVariant, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid grid-cols-[4rem_1fr_5rem] gap-2">
        <input name="size" required placeholder="Size" aria-label="Size" className={field} />
        <input name="sku" placeholder="SKU (auto)" aria-label="SKU" className={field} />
        <input name="quantity" type="number" min={0} defaultValue={0} aria-label="Starting stock" className={field} />
      </div>
      <button disabled={pending} className={btnGhost}>{pending ? "Adding…" : "Add size"}</button>
      <ActionMsg state={state} />
    </form>
  );
}

export function UploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(uploadImages, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="product_id" value={productId} />
      <input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sand file:px-4 file:py-2 file:text-sm" />
      <input name="url" placeholder="…or an image path / https URL" className={field} />
      <label className="flex items-center gap-2 text-xs text-stone"><input type="checkbox" name="fit" value="contain" className="accent-[var(--color-ink)]" /> Cut-out product (show whole item on beige)</label>
      <button disabled={pending} className={btn}>{pending ? "Uploading…" : "Add photos"}</button>
      <p className="text-[0.7rem] text-stone">JPG, PNG, WebP or AVIF, up to 5 MB each.</p>
      <ActionMsg state={state} />
    </form>
  );
}
