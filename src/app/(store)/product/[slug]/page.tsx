import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/animations/reveal";
import { ProductCard } from "@/components/products/product-card";
import { categoryName, priceOf, relatedProducts, totalStock } from "@/lib/catalog";
import { getCatalog, getLocalizedCatalog } from "@/lib/catalog-source";
import { getI18n } from "@/lib/i18n/server";
import { Gallery } from "./gallery";
import { PurchasePanel } from "./purchase-panel";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return (await getCatalog()).products.map((p) => ({ slug: p.slug }));
}
export const revalidate = 120; // new products render on first request

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await getI18n();
  const { slug } = await params;
  const p = (await getLocalizedCatalog(locale)).products.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.name}, ${p.colour}`,
    description: p.description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: `${p.name} · DEMO`, description: p.description, images: [{ url: p.images[0].src, alt: p.images[0].alt }] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const { products, categories } = await getLocalizedCatalog(locale);
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const related = relatedProducts(products, p);
  const cat = categoryName(categories, p.category);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    color: p.colour,
    image: p.images.map((i) => (i.src.startsWith("http") ? i.src : `${site}${i.src}`)),
    sku: p.id.toUpperCase(),
    brand: { "@type": "Brand", name: "DEMO" },
    offers: {
      "@type": "Offer",
      url: `${site}/product/${p.slug}`,
      priceCurrency: "BDT",
      price: priceOf(p),
      availability: totalStock(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x pb-20 pt-8 md:pt-12">
        <nav aria-label={t("product.breadcrumb")} className="text-xs text-stone">
          <Link href="/" className="hover:text-ink">{t("shop.home")}</Link><span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-ink">{t("shop.shop")}</Link><span className="mx-1.5">/</span>
          {cat && <><Link href={`/shop?category=${p.category}`} className="hover:text-ink">{cat}</Link><span className="mx-1.5">/</span></>}
          <span className="text-ink">{p.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-7">
            <Gallery images={p.images} name={p.name} />
          </div>
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <PurchasePanel product={p} />
            </div>
          </div>
        </div>
      </div>

      <section className="container-x border-t border-line py-20 md:py-28">
        <Reveal>
          <p className="label mb-4 text-stone">{t("product.lookEyebrow")}</p>
          <h2 className="font-serif text-4xl text-ink md:text-6xl">{t("product.lookTitle")}</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {related.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.08}><ProductCard product={r} /></Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
