import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealWords } from "@/components/animations/reveal";
import { ProductCard } from "@/components/products/product-card";
import { byTag } from "@/lib/catalog";
import { getLocalizedCatalog } from "@/lib/catalog-source";
import { getI18n } from "@/lib/i18n/server";
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
  { id: "outerwear", href: "/shop?category=jackets", img: "/images/editorial/trench-chair.webp", pos: "50% 30%" },
  { id: "knitwear", href: "/shop?category=womens-fashion", img: "/images/editorial/cardigan-desert.webp", pos: "78% 50%" },
  { id: "occasion", href: "/shop?category=dresses", img: "/images/editorial/pleated-dunes.webp", pos: "55% 40%" },
];

export async function FeaturedCollections() {
  const { t } = await getI18n();
  return (
    <section className="container-x py-24 md:py-36">
      <SectionHead eyebrow={t("home.collections.eyebrow")} title={t("home.collections.title")} href="/shop" cta={t("home.collections.cta")} />
      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.12} className={i === 1 ? "md:mt-20" : ""}>
            <Link href={c.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-sand">
                <Image
                  src={c.img}
                  alt={t(`home.collectionItems.${c.id}.title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectPosition: c.pos }}
                  className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-soft)] group-hover:scale-[1.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-ivory">
                  <div>
                    <p className="font-serif text-4xl">{t(`home.collectionItems.${c.id}.title`)}</p>
                    <p className="mt-1 text-xs tracking-wide opacity-80">{t(`home.collectionItems.${c.id}.sub`)}</p>
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
export async function ProductRail({ tag }: { tag: "new" | "bestseller" }) {
  const { t, locale } = await getI18n();
  const items = byTag((await getLocalizedCatalog(locale)).products, tag).slice(0, 4);
  const k = tag === "new" ? "home.newIn" : "home.best";
  const eyebrow = t(`${k}.eyebrow`), title = t(`${k}.title`);
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHead eyebrow={eyebrow} title={title} href={`/shop?sort=${tag === "new" ? "new" : "popular"}`} cta={t("home.shopAll")} />
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
export async function PromoBanner() {
  const { t } = await getI18n();
  return (
    <section className="px-3 md:px-6">
      <div className="relative h-[78svh] min-h-[480px] overflow-hidden rounded-[2px]">
        <ParallaxImage src="/images/editorial/trench-studio.webp" alt={t("home.promo.alt")} position="60% 30%" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/20 to-transparent" />
        <div className="container-x relative flex h-full flex-col justify-end pb-12 text-ivory md:justify-center md:pb-0">
          <Reveal><p className="label mb-5 opacity-80">{t("home.promo.eyebrow")}</p></Reveal>
          <h2 className="max-w-xl font-serif text-5xl leading-[0.95] md:text-8xl">
            <RevealWords text={t("home.promo.title")} />
          </h2>
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-sm text-sm leading-relaxed opacity-85">
              {t("home.promo.body")}
            </p>
            <Link href="/shop?category=jackets" className="group mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-ivory pl-7 pr-2 text-sm font-medium text-ink">
              {t("home.promo.cta")}
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
export async function BrandStory() {
  const { t } = await getI18n();
  return (
    <section className="container-x grid items-center gap-14 py-24 md:grid-cols-12 md:py-36">
      <Reveal className="md:col-span-5">
        <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-t-full bg-sand">
          <Image src="/images/editorial/beige-tailoring.webp" alt={t("home.story.alt")} fill sizes="(max-width: 768px) 90vw, 40vw" className="object-cover" style={{ objectPosition: "50% 20%" }} />
        </div>
      </Reveal>
      <div className="md:col-span-6 md:col-start-7">
        <Reveal><p className="label mb-5 text-stone">{t("home.story.eyebrow")}</p></Reveal>
        <h2 className="font-serif text-5xl leading-[0.95] text-ink md:text-7xl">
          <RevealWords text={t("home.story.title")} />
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-lg leading-relaxed text-stone">
            {t("home.story.body")}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              [t("home.story.s1v"), t("home.story.s1")],
              [t("home.story.s2v"), t("home.story.s2")],
              [t("home.story.s3v"), t("home.story.s3")],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-serif text-4xl text-ink md:text-5xl">{n}</dt>
                <dd className="mt-1 text-xs text-stone">{l}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-ink">
            <span className="relative">
              {t("home.story.cta")}
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
export async function Lookbook() {
  const { t } = await getI18n();
  return (
    <section className="container-x grid gap-5 pb-24 md:grid-cols-12 md:gap-6 md:pb-36">
      <Reveal className="md:col-span-8">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[2px] bg-sand">
          <ParallaxImage src="/images/editorial/linen-duo.webp" alt={t("home.lookbook.alt")} position="50% 35%" />
        </div>
      </Reveal>
      <Reveal delay={0.15} className="flex flex-col justify-end md:col-span-4">
        <p className="label mb-4 text-stone">{t("home.lookbook.eyebrow")}</p>
        <p className="font-serif text-4xl leading-tight text-ink md:text-5xl">{t("home.lookbook.title")}</p>
        <p className="mt-5 text-sm leading-relaxed text-stone">{t("home.lookbook.body")}</p>
        <Link href="/shop?category=womens-fashion" className="mt-8 inline-flex h-11 w-fit items-center rounded-full border border-ink/20 px-6 text-sm font-medium text-ink transition-colors duration-300 hover:bg-ink hover:text-ivory">
          {t("home.lookbook.cta")}
        </Link>
      </Reveal>
    </section>
  );
}
