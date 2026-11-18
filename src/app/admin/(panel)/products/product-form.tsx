"use client";

import { useActionState } from "react";
import { ActionMsg, btn, field } from "@/components/admin/ui";
import { saveProduct } from "./actions";

export type ProductValues = {
  id?: string; name: string; slug: string; category_id: string; gender: string; colour: string; colour_hex: string;
  price_bdt: number | ""; sale_price_bdt: number | null | ""; description: string; details: string[];
  is_active: boolean; is_new: boolean; is_bestseller: boolean;
};

export function ProductForm({ values, categories }: { values: ProductValues; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveProduct, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <L label="Name" className="sm:col-span-2"><input name="name" required defaultValue={values.name} className={field} /></L>
      <L label="URL slug (blank = from name)"><input name="slug" defaultValue={values.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={field} /></L>
      <L label="Category">
        <select name="category_id" required defaultValue={values.category_id} className={field}>
          <option value="" disabled>Choose…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </L>
      <L label="For">
        <select name="gender" defaultValue={values.gender} className={field}>
          {["women", "men", "unisex", "kids"].map((g) => <option key={g} value={g}>{g[0].toUpperCase() + g.slice(1)}</option>)}
        </select>
      </L>
      <div className="grid grid-cols-[1fr_4rem] gap-2">
        <L label="Colour name"><input name="colour" required defaultValue={values.colour} className={field} /></L>
        <L label="Swatch"><input name="colour_hex" type="color" defaultValue={values.colour_hex} className="h-10 w-full cursor-pointer rounded-[2px] border border-ink/15" /></L>
      </div>
      <L label="Price (BDT)"><input name="price_bdt" type="number" min={1} step={1} required defaultValue={values.price_bdt} className={field} /></L>
      <L label="Sale price (optional)"><input name="sale_price_bdt" type="number" min={1} step={1} defaultValue={values.sale_price_bdt ?? ""} className={field} /></L>
      <L label="Description" className="sm:col-span-2"><textarea name="description" rows={4} defaultValue={values.description} className={`${field} h-auto py-2`} /></L>
      <L label="Details & care (one per line)" className="sm:col-span-2"><textarea name="details" rows={4} defaultValue={values.details.join("\n")} className={`${field} h-auto py-2`} /></L>
      <div className="flex flex-wrap gap-5 sm:col-span-2">
        <Check name="is_active" label="Visible in store" checked={values.is_active} />
        <Check name="is_new" label="New arrival" checked={values.is_new} />
        <Check name="is_bestseller" label="Best seller" checked={values.is_bestseller} />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button disabled={pending} className={btn}>{pending ? "Saving…" : values.id ? "Save changes" : "Create product"}</button>
        <ActionMsg state={state} />
      </div>
    </form>
  );
}

function L({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs text-stone">{label}</span>{children}</label>;
}
function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-[var(--color-ink)]" />{label}</label>;
}
