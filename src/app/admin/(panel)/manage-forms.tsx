"use client";

import { useActionState } from "react";
import { ActionMsg, btn, btnGhost, field } from "@/components/admin/ui";
import { createCoupon, saveCategory, saveUsdRate, saveZone } from "./manage-actions";

export function CategoryForm({ c }: { c?: { id: string; name: string; name_bn?: string | null; slug: string; sort: number; is_active: boolean } }) {
  const [state, action, pending] = useActionState(saveCategory, {});
  return (
    <form action={action} className="grid grid-cols-[1fr_1fr_1fr_4rem_auto_auto] items-center gap-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <input name="name" required defaultValue={c?.name} placeholder="Name" aria-label="Category name" className={field} />
      <input name="name_bn" defaultValue={c?.name_bn ?? ""} placeholder="বাংলা নাম" aria-label="Category name in Bangla" lang="bn" className={field} />
      <input name="slug" required defaultValue={c?.slug} placeholder="slug" aria-label="Slug" className={field} />
      <input name="sort" type="number" min={0} defaultValue={c?.sort ?? 0} aria-label="Sort order" className={field} />
      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} className="accent-[var(--color-ink)]" /> Live</label>
      <button disabled={pending} className={c ? btnGhost : btn}>{c ? "Save" : "Add"}</button>
      {(state.error || state.ok) && <div className="col-span-6"><ActionMsg state={state} /></div>}
    </form>
  );
}

export function CouponForm() {
  const [state, action, pending] = useActionState(createCoupon, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <L label="Code"><input name="code" required placeholder="EID20" className={`${field} uppercase`} /></L>
      <L label="Type">
        <select name="kind" className={field}><option value="percent">Percent off</option><option value="fixed">Fixed ৳ off</option></select>
      </L>
      <L label="Value"><input name="value" type="number" min={1} required className={field} /></L>
      <L label="Minimum spend (৳)"><input name="min_subtotal_bdt" type="number" min={0} defaultValue={0} className={field} /></L>
      <L label="Max discount (৳, optional)"><input name="max_discount_bdt" type="number" min={1} className={field} /></L>
      <L label="Usage limit (optional)"><input name="usage_limit" type="number" min={1} className={field} /></L>
      <L label="Expires (optional)"><input name="expires_at" type="date" className={field} /></L>
      <div className="flex items-end gap-3 sm:col-span-2">
        <button disabled={pending} className={btn}>{pending ? "Creating…" : "Create coupon"}</button>
        <ActionMsg state={state} />
      </div>
    </form>
  );
}

export function ZoneForm({ z }: { z: { id: string; label: string; fee_bdt: number; free_over_bdt: number | null; eta: string } }) {
  const [state, action, pending] = useActionState(saveZone, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_7rem_9rem_8rem_auto] sm:items-end">
      <input type="hidden" name="id" value={z.id} />
      <L label="Label"><input name="label" defaultValue={z.label} required className={field} /></L>
      <L label="Fee (৳)"><input name="fee_bdt" type="number" min={0} defaultValue={z.fee_bdt} required className={field} /></L>
      <L label="Free over (৳)"><input name="free_over_bdt" type="number" min={1} defaultValue={z.free_over_bdt ?? ""} placeholder="Never" className={field} /></L>
      <L label="Delivery time"><input name="eta" defaultValue={z.eta} className={field} /></L>
      <button disabled={pending} className={btnGhost}>{pending ? "…" : "Save"}</button>
      {(state.error || state.ok) && <div className="sm:col-span-5"><ActionMsg state={state} /></div>}
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs text-stone">{label}</span>{children}</label>;
}

export function UsdRateForm({ rate }: { rate: number | null }) {
  const [state, action, pending] = useActionState(saveUsdRate, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <L label="Taka per 1 US$"><input name="bdt_per_usd" type="number" step="0.01" min={50} max={500} required defaultValue={rate ?? ""} className={`${field} w-36`} /></L>
      <button disabled={pending} className={btnGhost}>{pending ? "…" : "Save rate"}</button>
      <div className="basis-full"><ActionMsg state={state} /></div>
    </form>
  );
}
