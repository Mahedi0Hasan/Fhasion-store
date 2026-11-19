"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/admin/auth";
import { userClient } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/catalog-source";

type State = { error?: string; ok?: string };
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const fail = (e: { code?: string; message: string }): State => ({
  error: e.code === "23505" ? "That already exists." : /row-level security|42501/.test(`${e.code} ${e.message}`) ? "You don't have permission to do that." : e.code === "23514" ? "Some values aren't allowed." : "Couldn't save.",
});

/* ───────────── categories ───────────── */
const catSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(80),
  name_bn: z.string().trim().max(80).optional().transform((v) => v || null),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes.").max(60),
  sort: z.coerce.number().int().min(0).max(999).default(0),
  is_active: bool,
});

export async function saveCategory(_p: State, fd: FormData): Promise<State> {
  await requireStaff();
  const v = catSchema.safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: v.error.issues[0].message };
  const { id, ...row } = v.data;
  const db = await userClient();
  const { error } = id ? await db.from("categories").update(row).eq("id", id) : await db.from("categories").insert(row);
  if (error) return fail(error);
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/categories");
  return { ok: id ? "Saved." : "Category added." };
}

/* ───────────── coupons ───────────── */
const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,32}$/, "Codes: 3–32 letters/numbers."),
  kind: z.enum(["percent", "fixed"]),
  value: z.coerce.number().int().min(1).max(1_000_000),
  min_subtotal_bdt: z.coerce.number().int().min(0).default(0),
  max_discount_bdt: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
  usage_limit: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
  expires_at: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
});

export async function createCoupon(_p: State, fd: FormData): Promise<State> {
  await requireStaff();
  const v = couponSchema.safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: v.error.issues[0].message };
  const c = v.data;
  if (c.kind === "percent" && c.value > 100) return { error: "Percent discounts can't exceed 100." };
  const db = await userClient();
  const { error } = await db.from("coupons").insert({
    code: c.code, kind: c.kind, value: c.value, min_subtotal_bdt: c.min_subtotal_bdt,
    max_discount_bdt: c.max_discount_bdt || null, usage_limit: c.usage_limit || null,
    expires_at: c.expires_at ? `${c.expires_at}T23:59:59+06:00` : null,
  });
  if (error) return fail(error);
  revalidatePath("/admin/coupons");
  return { ok: `${c.code} created.` };
}

export async function toggleCoupon(fd: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(fd.get("id"));
  const active = fd.get("active") === "true";
  const db = await userClient();
  await db.from("coupons").update({ is_active: !active }).eq("id", id);
  revalidatePath("/admin/coupons");
}

/* ───────────── shipping (admin only) ───────────── */
const zoneSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(2).max(60),
  fee_bdt: z.coerce.number().int().min(0).max(100_000),
  free_over_bdt: z.union([z.literal(""), z.coerce.number().int().min(1)]).optional(),
  eta: z.string().trim().max(40),
});

export async function saveZone(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const v = zoneSchema.safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: v.error.issues[0].message };
  const db = await userClient();
  const { data, error } = await db.from("shipping_zones")
    .update({ label: v.data.label, fee_bdt: v.data.fee_bdt, free_over_bdt: v.data.free_over_bdt || null, eta: v.data.eta })
    .eq("id", v.data.id).select("id");
  if (error) return fail(error);
  if (!data?.length) return { error: "You don't have permission to do that." };
  revalidatePath("/admin/settings");
  return { ok: "Saved. Checkout uses the new fee for all new orders." };
}

/* ───────────── USD display rate (admin only) ───────────── */
export async function saveUsdRate(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const v = z.coerce.number().min(50, "Rate looks too low.").max(500, "Rate looks too high.").safeParse(fd.get("bdt_per_usd"));
  if (!v.success) return { error: v.error.issues[0].message };
  const rate = Math.round(v.data * 100) / 100;
  const db = await userClient();
  const { data, error } = await db.from("store_settings").upsert({ key: "usd_rate", value: { bdt_per_usd: rate }, is_public: true }).select("key");
  if (error) return fail(error);
  if (!data?.length) return { error: "You don't have permission to do that." };
  revalidateTag(CATALOG_TAG);
  return { ok: `Saved: 1 US$ = ৳ ${rate}. Storefront USD prices update now.` };
}
