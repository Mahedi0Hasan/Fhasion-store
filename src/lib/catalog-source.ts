import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { DEMO_CATEGORIES, DEMO_PRODUCTS, localizeCategory, localizeProduct, type Category, type Product } from "./catalog";
import { SHIPPING_ZONES } from "./shipping/zones";
import type { Locale } from "./i18n";

/**
 * Storefront catalogue. Reads the active catalogue from Supabase with the
 * public anon key (so RLS decides what is visible), cached and tagged
 * "catalog" — admin edits call revalidateTag("catalog").
 * Falls back to the demo catalogue when no database is configured.
 */
export const CATALOG_TAG = "catalog";

type Row = {
  id: string; legacy_id: string | null; slug: string; name: string; description: string; details: string[];
  name_bn: string | null; colour_bn: string | null; description_bn: string | null; details_bn: string[] | null;
  gender: Product["gender"] | "kids"; colour: string; colour_hex: string; price_bdt: number; sale_price_bdt: number | null;
  is_new: boolean; is_bestseller: boolean; popularity: number; created_at: string;
  category: { slug: string } | null;
  product_images: { src: string; alt: string; fit: "contain" | "cover"; object_position: string | null; sort: number }[];
  product_variants: { size: string; is_active: boolean; inventory: { quantity: number } | null }[];
};

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Image src: absolute URLs and /public paths pass through; Storage paths become public URLs. */
export function imageUrl(src: string) {
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${src}`;
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
const sizeRank = (s: string) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100 + (Number(s) || 0));

function toProduct(r: Row): Product {
  const stock: Record<string, number> = {};
  for (const v of [...r.product_variants].filter((v) => v.is_active).sort((a, b) => sizeRank(a.size) - sizeRank(b.size))) {
    stock[v.size] = v.inventory?.quantity ?? 0;
  }
  const images = [...r.product_images].sort((a, b) => a.sort - b.sort).map((i) => ({
    src: imageUrl(i.src), alt: i.alt || r.name, fit: i.fit, position: i.object_position ?? undefined,
  }));
  return {
    // Keep demo ids stable so carts saved before the DB switch still resolve.
    id: r.legacy_id ?? r.id,
    slug: r.slug,
    name: r.name,
    category: r.category?.slug ?? "",
    gender: r.gender === "kids" ? "unisex" : r.gender,
    colour: r.colour,
    colourHex: r.colour_hex,
    priceBDT: r.price_bdt,
    salePriceBDT: r.sale_price_bdt ?? undefined,
    description: r.description,
    details: r.details ?? [],
    images: images.length ? images : [{ src: "/images/placeholder.svg", alt: r.name, fit: "contain" }],
    stock,
    tags: [...(r.is_new ? (["new"] as const) : []), ...(r.is_bestseller ? (["bestseller"] as const) : [])],
    createdAt: r.created_at.slice(0, 10),
    popularity: r.popularity,
    bn: { name: r.name_bn ?? undefined, colour: r.colour_bn ?? undefined, description: r.description_bn ?? undefined, details: r.details_bn ?? [] },
  };
}

export type Zone = { id: string; label: string; feeBDT: number; freeOverBDT?: number; eta: string };
type Catalog = { products: Product[]; categories: Category[]; zones: Zone[]; source: "db" | "demo" };
const STATIC_ZONES: Zone[] = SHIPPING_ZONES.map((z) => ({ id: z.id, label: z.label, feeBDT: z.feeBDT, freeOverBDT: z.freeOverBDT, eta: z.eta }));

const fetchCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const db = anonClient();
    if (!db) return { products: DEMO_PRODUCTS, categories: DEMO_CATEGORIES, zones: STATIC_ZONES, source: "demo" };
    const [p, c, z] = await Promise.all([
      db.from("products").select(
        "id,legacy_id,slug,name,description,details,name_bn,colour_bn,description_bn,details_bn,gender,colour,colour_hex,price_bdt,sale_price_bdt,is_new,is_bestseller,popularity,created_at," +
          "category:categories(slug),product_images(src,alt,fit,object_position,sort),product_variants(size,is_active,inventory(quantity))",
      ).eq("is_active", true).order("created_at", { ascending: false }),
      db.from("categories").select("slug,name,name_bn").eq("is_active", true).order("sort"),
      db.from("shipping_zones").select("id,label,fee_bdt,free_over_bdt,eta").eq("is_active", true).order("sort"),
    ]);
    if (p.error || c.error || z.error) throw new Error(`Catalogue fetch failed: ${p.error?.message ?? c.error?.message ?? z.error?.message}`);
    return {
      products: (p.data as unknown as Row[]).map(toProduct),
      categories: (c.data as { slug: string; name: string; name_bn: string | null }[]).map((x) => ({ slug: x.slug, name: x.name, nameBn: x.name_bn ?? undefined })),
      // Fees come from the database so the cart estimate always matches what checkout charges.
      zones: (z.data as { id: string; label: string; fee_bdt: number; free_over_bdt: number | null; eta: string }[]).map((x) => ({ id: x.id, label: x.label, feeBDT: x.fee_bdt, freeOverBDT: x.free_over_bdt ?? undefined, eta: x.eta })),
      source: "db",
    };
  },
  ["catalog-v2"],
  { tags: [CATALOG_TAG], revalidate: 120 },
);

export const getCatalog = fetchCatalog;
export async function getProducts() { return (await fetchCatalog()).products; }
export async function getCategories() { return (await fetchCatalog()).categories; }
export async function getProductBySlug(slug: string) { return (await fetchCatalog()).products.find((p) => p.slug === slug); }

/** Catalogue with Bangla names/descriptions swapped in for display. Filtering should use getCatalog (stable English keys). */
export async function getLocalizedCatalog(locale: Locale) {
  const c = await fetchCatalog();
  if (locale === "en") return c;
  return { ...c, products: c.products.map((p) => localizeProduct(p, locale)), categories: c.categories.map((x) => localizeCategory(x, locale)) };
}
export async function getZones() { return (await fetchCatalog()).zones; }
