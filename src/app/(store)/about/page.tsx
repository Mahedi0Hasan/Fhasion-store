import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { ABOUT } from "@/content/pages";
import { Reveal, RevealWords } from "@/components/animations/reveal";
import { ParallaxImage } from "@/components/home/parallax-image";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = ABOUT[locale];
  return { title: c.eyebrow, description: c.lead, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const { locale, t, num } = await getI18n();
  const c = ABOUT[locale];
  const images = [
    { src: "/images/editorial/beige-tailoring.webp", alt: t("home.story.alt"), pos: "50% 20%" },
    { src: "/images/editorial/trench-chair.webp", alt: t("home.promo.alt"), pos: "50% 30%" },
    { src: "/images/editorial/pleated-dunes.webp", alt: t("home.lookbook.alt"), pos: "55% 40%" },
  ];
  return (
    <>
      <section className="container-x pb-16 pt-14 md:pb-24 md:pt-20">
        <Reveal><p className="label text-stone">{c.eyebrow}</p></Reveal>
        <h1 className="mt-5 max-w-5xl font-serif text-6xl leading-[0.92] text-ink md:text-9xl"><RevealWords text={c.title} /></h1>
        <Reveal delay={0.2}><p className="mt-8 max-w-2xl text-lg leading-relaxed text-stone md:text-xl">{c.lead}</p></Reveal>
      </section>

      <section className="px-3 md:px-6">
        <div className="relative h-[70svh] min-h-[420px] overflow-hidden rounded-[2px] bg-sand">
          <ParallaxImage src="/images/editorial/linen-duo.webp" alt={t("home.lookbook.alt")} position="50% 35%" />
        </div>
      </section>

      <section className="container-x grid gap-14 py-24 md:grid-cols-12 md:py-32">
        <div className="space-y-16 md:col-span-6">
          {c.sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.08}>
              <p className="font-serif text-lg text-clay">{num(i + 1).padStart(2, num(0))}</p>
              <h2 className="mt-2 font-serif text-4xl text-ink md:text-5xl">{s.h}</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-stone">{s.p}</p>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:col-span-5 md:col-start-8">
          {images.map((im, i) => (
            <Reveal key={im.src} delay={i * 0.1} className={i === 0 ? "col-span-2" : ""}>
              <div className={`relative overflow-hidden bg-sand ${i === 0 ? "aspect-[4/5] rounded-t-full" : "aspect-[3/4]"}`}>
                <Image src={im.src} alt={im.alt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" style={{ objectPosition: im.pos }} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ivory">
        <dl className="container-x grid grid-cols-3 gap-6 py-14 md:py-20">
          {c.values.map((v) => (
            <div key={v.v} className="text-center">
              <dt className="font-serif text-5xl text-ink md:text-7xl">{v.k}</dt>
              <dd className="mt-2 text-sm text-stone">{v.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-x py-24 text-center md:py-32">
        <Link href="/shop" className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-7 pr-2 text-sm font-medium text-ivory">
          {c.cta}
          <span className="grid size-8 place-items-center rounded-full bg-ivory text-ink transition-transform duration-500 group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
        </Link>
      </section>
    </>
  );
}
