"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/admin/auth";
import { userClient } from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/catalog-source";

type State = { error?: string; ok?: string };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const int = (min = 0) => z.coerce.number().int().min(min).max(10_000_000);

function refresh(id?: string) {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  if (id) revalidatePath(`/admin/products/${id}`);
}
function dbError(e: { code?: string; message: string }) {
  if (e.code === "23505") return "That slug or SKU is already in use.";
  if (e.code === "42501" || /row-level security/.test(e.message)) return "You don't have permission to do that.";
  if (e.code === "23514") return "Some values aren't allowed. Check prices (sale must be lower than price) and the colour code.";
  return "Couldn't save. Please try again.";
}

/* ───────────── product ───────────── */
const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional(),
  category_id: z.string().uuid("Choose a category."),
  gender: z.enum(["women", "men", "unisex", "kids"]),
  colour: z.string().trim().min(1).max(40),
  colour_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  price_bdt: int(1),
  sale_price_bdt: z.union([z.literal(""), int(1)]).optional(),
  description: z.string().trim().max(2000).default(""),
  details: z.string().max(2000).default(""),
  is_active: bool, is_new: bool, is_bestseller: bool,
});

export async function saveProduct(_prev: State, fd: FormData): Promise<State> {
  await requireStaff();
  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${i.path.join(".")}: ${i.message}` };
  }
  const v = parsed.data;
  const sale = v.sale_price_bdt === "" || v.sale_price_bdt === undefined ? null : v.sale_price_bdt;
  if (sale !== null && sale >= v.price_bdt) return { error: "Sale price must be lower than the regular price." };
  const row = {
    name: v.name, slug: slugify(v.slug || v.name), category_id: v.category_id, gender: v.gender, colour: v.colour,
    colour_hex: v.colour_hex.toLowerCase(), price_bdt: v.price_bdt, sale_price_bdt: sale, description: v.description,
    details: v.details.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    is_active: v.is_active, is_new: v.is_new, is_bestseller: v.is_bestseller,
  };
  if (!row.slug) return { error: "Please give the product a name." };

  const db = await userClient();
  if (v.id) {
    const { error } = await db.from("products").update(row).eq("id", v.id);
    if (error) return { error: dbError(error) };
    refresh(v.id);
    return { ok: "Saved." };
  }
  const { data, error } = await db.from("products").insert(row).select("id").single();
  if (error) return { error: dbError(error) };
  refresh(data.id);
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function deleteProduct(fd: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(fd.get("id"));
  const db = await userClient();
  // Orders keep their own snapshot of name/price, so history stays intact.
  const { data: imgs } = await db.from("product_images").select("src").eq("product_id", id);
  await db.from("products").delete().eq("id", id);
  const paths = (imgs ?? []).map((i) => i.src).filter((s) => !s.startsWith("/") && !s.startsWith("http"));
  if (paths.length) await db.storage.from("product-images").remove(paths);
  refresh();
  redirect("/admin/products?deleted=1");
}

/* ───────────── variants & stock ───────────── */
const variantSchema = z.object({
  product_id: z.string().uuid(),
  size: z.string().trim().toUpperCase().min(1).max(8).regex(/^[A-Z0-9.]+$/, "Sizes use letters/numbers only."),
  sku: z.string().trim().toUpperCase().max(40).optional(),
  quantity: int(0),
});

export async function addVariant(_prev: State, fd: FormData): Promise<State> {
  await requireStaff();
  const parsed = variantSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const db = await userClient();
  const sku = (v.sku || `DM-${v.product_id.slice(0, 6)}-${v.size}`).toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const { data, error } = await db.from("product_variants").insert({ product_id: v.product_id, size: v.size, sku }).select("id").single();
  if (error) return { error: error.code === "23505" ? "That size or SKU already exists." : dbError(error) };
  const inv = await db.from("inventory").insert({ variant_id: data.id, quantity: v.quantity });
  if (inv.error) return { error: dbError(inv.error) };
  refresh(v.product_id);
  return { ok: `Size ${v.size} added.` };
}

const stockSchema = z.object({
  variant_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: int(0),
  low_stock_threshold: int(0).optional(),
  is_active: bool.optional(),
});

export async function updateStock(_prev: State, fd: FormData): Promise<State> {
  await requireStaff();
  const parsed = stockSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Stock must be a whole number, 0 or more." };
  const v = parsed.data;
  const db = await userClient();
  const patch: { quantity: number; low_stock_threshold?: number } = { quantity: v.quantity };
  if (v.low_stock_threshold !== undefined) patch.low_stock_threshold = v.low_stock_threshold;
  const { data, error } = await db.from("inventory").update(patch).eq("variant_id", v.variant_id).select("variant_id");
  if (error || !data?.length) return { error: error ? dbError(error) : "You don't have permission to do that." };
  if (fd.has("is_active_present")) {
    await db.from("product_variants").update({ is_active: v.is_active ?? false }).eq("id", v.variant_id);
  }
  refresh(v.product_id);
  return { ok: "Saved." };
}

/* ───────────── images ───────────── */
const MAX_BYTES = 5 * 1024 * 1024;
const SIGNATURES: [string, (b: Uint8Array) => boolean][] = [
  ["jpg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["png", (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  ["webp", (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP"],
  ["avif", (b) => String.fromCharCode(...b.slice(4, 12)).startsWith("ftypavi")],
];

export async function uploadImages(_prev: State, fd: FormData): Promise<State> {
  await requireStaff();
  const productId = z.string().uuid().parse(fd.get("product_id"));
  const fit = fd.get("fit") === "contain" ? "contain" : "cover";
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 10);
  const url = String(fd.get("url") ?? "").trim();
  if (!files.length && !url) return { error: "Choose at least one image." };

  const db = await userClient();
  const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  let sort = count ?? 0;
  const rows: { product_id: string; src: string; alt: string; fit: string; sort: number }[] = [];

  if (url) {
    // Site images or https URLs only — never arbitrary schemes.
    if (!/^\/images\/[\w\-/.]+\.(webp|png|jpe?g|avif|svg)$/i.test(url) && !/^https:\/\/[\w.-]+\/[\w\-/.%]+$/i.test(url)) {
      return { error: "Image URL must be a /images/… path or an https:// link." };
    }
    rows.push({ product_id: productId, src: url, alt: "", fit, sort: sort++ });
  }

  for (const f of files) {
    if (f.size > MAX_BYTES) return { error: `${f.name} is over 5 MB.` };
    const bytes = new Uint8Array(await f.arrayBuffer());
    // Trust the file's bytes, not its name or the browser's MIME type.
    const kind = SIGNATURES.find(([, test]) => test(bytes))?.[0];
    if (!kind) return { error: `${f.name} isn't a JPG, PNG, WebP or AVIF image.` };
    const path = `${productId}/${randomUUID()}.${kind}`;
    const up = await db.storage.from("product-images").upload(path, bytes, { contentType: `image/${kind === "jpg" ? "jpeg" : kind}`, upsert: false });
    if (up.error) return { error: `Upload failed for ${f.name}. Is Supabase Storage set up?` };
    rows.push({ product_id: productId, src: path, alt: "", fit, sort: sort++ });
  }

  const { error } = await db.from("product_images").insert(rows);
  if (error) return { error: dbError(error) };
  refresh(productId);
  return { ok: `${rows.length} image${rows.length > 1 ? "s" : ""} added.` };
}

export async function imageAction(fd: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(fd.get("id"));
  const productId = z.string().uuid().parse(fd.get("product_id"));
  const op = z.enum(["delete", "first", "fit"]).parse(fd.get("op"));
  const db = await userClient();
  if (op === "delete") {
    const { data } = await db.from("product_images").delete().eq("id", id).select("src").single();
    if (data && !data.src.startsWith("/") && !data.src.startsWith("http")) await db.storage.from("product-images").remove([data.src]);
  } else if (op === "first") {
    const { data: all } = await db.from("product_images").select("id").eq("product_id", productId).order("sort");
    const order = [id, ...(all ?? []).map((r) => r.id).filter((x) => x !== id)];
    await Promise.all(order.map((imgId, i) => db.from("product_images").update({ sort: i }).eq("id", imgId)));
  } else {
    const { data } = await db.from("product_images").select("fit").eq("id", id).single();
    await db.from("product_images").update({ fit: data?.fit === "contain" ? "cover" : "contain" }).eq("id", id);
  }
  refresh(productId);
}
