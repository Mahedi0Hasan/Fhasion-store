import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog-source";
import { POLICY_SLUGS } from "@/content/pages";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { products, categories } = await getCatalog();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["about", "contact", "faq", "track-order", ...POLICY_SLUGS].map((s) => ({ url: `${base}/${s}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 })),
  ];
}
