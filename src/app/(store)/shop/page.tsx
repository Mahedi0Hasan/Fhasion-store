import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/reveal";
import { ProductCard } from "@/components/products/product-card";
import { categoryName, parseShopQuery, queryProducts, type ShopQuery } from "@/lib/catalog";
import { ShopControls } from "./shop-controls";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const q = parseShopQuery(await searchParams);
  const name = q.category ? categoryName(q.category) : undefined;
  return {
    title: name ?? (q.q ? `Search: ${q.q}` : "Shop all"),
    description: `Shop ${name ?? "the full DEMO collection"}: considered clothing, shoes and accessories. Delivery across Bangladesh and worldwide.`,
    alternates: { canonical: q.category ? `/shop?category=${q.category}` : "/shop" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const query = parseShopQuery(await searchParams);
  const { items, total, page, pages } = queryProducts(query);
  const title = query.category ? categoryName(query.category)! : query.q ? `“${query.q}”` : "Shop all";

  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-xs text-stone">
        <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {query.category && <><span className="mx-1.5">/</span><span className="text-ink">{title}</span></>}
      </nav>
      <h1 className="mt-4 font-serif text-5xl leading-none text-ink md:text-8xl">{title}</h1>

      <ShopControls query={query} total={total}>
        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-20">
            <p className="font-serif text-3xl text-ink">Nothing matches just yet.</p>
            <p className="max-w-sm text-sm text-stone">Try removing a filter or searching for something broader.</p>
            <Link href="/shop" className="mt-2 inline-flex h-11 items-center rounded-full bg-ink px-7 text-sm font-medium text-ivory">Clear all filters</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-6">
              {items.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 0.06} y={18}>
                  <ProductCard product={p} priority={i < 3} />
                </Reveal>
              ))}
            </div>
            {pages > 1 && <Pagination query={query} page={page} pages={pages} />}
          </>
        )}
      </ShopControls>
    </div>
  );
}

function hrefFor(q: ShopQuery, page: number) {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.category) sp.set("category", q.category);
  if (q.sizes.length) sp.set("size", q.sizes.join(","));
  if (q.colours.length) sp.set("colour", q.colours.join(","));
  if (q.min !== undefined) sp.set("min", String(q.min));
  if (q.max !== undefined) sp.set("max", String(q.max));
  if (q.sort !== "featured") sp.set("sort", q.sort);
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `/shop?${s}` : "/shop";
}

function Pagination({ query, page, pages }: { query: ShopQuery; page: number; pages: number }) {
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 && <Link href={hrefFor(query, page - 1)} className="h-10 rounded-full border border-ink/15 px-4 text-sm leading-10 hover:border-ink">Previous</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={hrefFor(query, n)}
          aria-current={n === page ? "page" : undefined}
          className={`grid size-10 place-items-center rounded-full text-sm ${n === page ? "bg-ink text-ivory" : "border border-ink/15 hover:border-ink"}`}
        >
          {n}
        </Link>
      ))}
      {page < pages && <Link href={hrefFor(query, page + 1)} className="h-10 rounded-full border border-ink/15 px-4 text-sm leading-10 hover:border-ink">Next</Link>}
    </nav>
  );
}
