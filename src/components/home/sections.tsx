import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealWords } from "@/components/animations/reveal";
import { ProductCard } from "@/components/products/product-card";
import { byTag } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-source";
import { ParallaxImage } from "./parallax-image";

function SectionHead({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div>
        <Reveal><p className="label mb-4 text-stone">{eyebrow}</p></Reveal>
        <h2 className="font-serif text-5xl leading-[0.95] text-ink md:text-7xl">
          <RevealWords text={title} />
        </h2>
      </div>
      {href && (
        <Reveal delay={0.2}>
          <Link href={href} className="group inline-flex items-center gap-2 text-sm font-medium text-ink">
            <span className="relative">
              {cta}
              <span className="absolute -bottom-1 left-0 h-px w-full bg-ink transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-x-0 group-hover:origin-right" />
            </span>
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}

/* ───────────── Featured collections ───────────── */
const COLLECTIONS = [
  { title: "Outerwear", sub: "Trench, wool & weather", href: "/shop?category=jackets", img: "/images/editorial/trench-chair.webp", pos: "50% 30%" },
  { title: "Knitwear", sub: "Cashmere & brushed cotton", href: "/shop?category=womens-fashion", img: "/images/editorial/cardigan-desert.webp", pos: "78% 50%" },
  { title: "Occasion", sub: "Pleats that move", href: "/shop?category=dresses", img: "/images/editorial/pleated-dunes.webp", pos: "55% 40%" },
];

export function FeaturedCollections() {
  return (
    <section className="container-x py-24 md:py-36">
      <SectionHead eyebrow="Collections" title="Dressed in quiet colour" href="/shop" cta="All collections" />
      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.12} className={i === 1 ? "md:mt-20" : ""}>
            <Link href={c.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-sand">
                <Image
                  src={c.img}
                  alt={`${c.title} collection`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectPosition: c.pos }}
                  className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-soft)] group-hover:scale-[1.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-ivory">
                  <div>
                    <p className="font-serif text-4xl">{c.title}</p>
                    <p className="mt-1 text-xs tracking-wide opacity-80">{c.sub}</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-ivory text-ink transition-transform duration-500 group-hover:rotate-45">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Product rails ───────────── */
export async function ProductRail({ tag, eyebrow, title }: { tag: "new" | "bestseller"; eyebrow: string; title: string }) {
  const items = byTag(await getProducts(), tag).slice(0, 4);
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHead eyebrow={eyebrow} title={title} href={`/shop?sort=${tag === "new" ? "new" : "popular"}`} cta="Shop all" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────── Promotional banner ───────────── */
export function PromoBanner() {
  return (
    <section className="px-3 md:px-6">
      <div className="relative h-[78svh] min-h-[480px] overflow-hidden rounded-[2px]">
        <ParallaxImage src="/images/editorial/trench-studio.webp" alt="Model in a cream trench coat seated in a studio" position="60% 30%" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/20 to-transparent" />
        <div className="container-x relative flex h-full flex-col justify-end pb-12 text-ivory md:justify-center md:pb-0">
          <Reveal><p className="label mb-5 opacity-80">Seasonal offer · Until 30 November</p></Reveal>
          <h2 className="max-w-xl font-serif text-5xl leading-[0.95] md:text-8xl">
            <RevealWords text="The trench, reconsidered." />
          </h2>
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-sm text-sm leading-relaxed opacity-85">
              Up to 20% off selected outerwear. Water-resistant cotton gabardine, cut long and worn loose.
            </p>
            <Link href="/shop?category=jackets" className="group mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-ivory pl-7 pr-2 text-sm font-medium text-ink">
              Shop outerwear
              <span className="grid size-8 place-items-center rounded-full bg-ink text-ivory transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Brand story ───────────── */
export function BrandStory() {
  return (
    <section className="container-x grid items-center gap-14 py-24 md:grid-cols-12 md:py-36">
      <Reveal className="md:col-span-5">
        <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-t-full bg-sand">
          <Image src="/images/editorial/beige-tailoring.webp" alt="Model wearing oat tailoring and a long coat" fill sizes="(max-width: 768px) 90vw, 40vw" className="object-cover" style={{ objectPosition: "50% 20%" }} />
        </div>
      </Reveal>
      <div className="md:col-span-6 md:col-start-7">
        <Reveal><p className="label mb-5 text-stone">Our story</p></Reveal>
        <h2 className="font-serif text-5xl leading-[0.95] text-ink md:text-7xl">
          <RevealWords text="Made slowly, meant to stay." />
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-lg leading-relaxed text-stone">
            DEMO began in a small Dhaka atelier with one idea: fewer, better pieces. We work with natural fibres, small
            mills and patient hands, and we design every garment to be worn for years, then repaired, not replaced.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              ["100%", "Natural fibres"],
              ["12", "Partner ateliers"],
              ["7-day", "Easy returns"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-serif text-4xl text-ink md:text-5xl">{n}</dt>
                <dd className="mt-1 text-xs text-stone">{l}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-ink">
            <span className="relative">
              Read our story
              <span className="absolute -bottom-1 left-0 h-px w-full bg-ink transition-transform duration-500 group-hover:origin-right group-hover:scale-x-0" />
            </span>
            <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Lookbook strip ───────────── */
export function Lookbook() {
  return (
    <section className="container-x grid gap-5 pb-24 md:grid-cols-12 md:gap-6 md:pb-36">
      <Reveal className="md:col-span-8">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[2px] bg-sand">
          <ParallaxImage src="/images/editorial/linen-duo.webp" alt="Two models in flax linen tailoring" position="50% 35%" />
        </div>
      </Reveal>
      <Reveal delay={0.15} className="flex flex-col justify-end md:col-span-4">
        <p className="label mb-4 text-stone">Lookbook · Linen</p>
        <p className="font-serif text-4xl leading-tight text-ink md:text-5xl">Linen, the way summer intended.</p>
        <p className="mt-5 text-sm leading-relaxed text-stone">Washed Belgian flax in suiting and slip skirts. Breathes in Dhaka heat, drapes everywhere else.</p>
        <Link href="/shop?category=womens-fashion" className="mt-8 inline-flex h-11 w-fit items-center rounded-full border border-ink/20 px-6 text-sm font-medium text-ink transition-colors duration-300 hover:bg-ink hover:text-ivory">
          Shop linen
        </Link>
      </Reveal>
    </section>
  );
}
