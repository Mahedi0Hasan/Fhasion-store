import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { FAQ } from "@/content/pages";
import { paymentOptions } from "@/lib/payments";
import { Reveal } from "@/components/animations/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { title: FAQ[locale].title, description: FAQ[locale].intro, alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const { locale, t } = await getI18n();
  const base = FAQ[locale];

  // The payment answer is built from what's actually switched on, so it can't go stale.
  const on = paymentOptions().filter((p) => p.available).map((p) => t(`checkout.methods.${p.id}.label`));
  const soon = paymentOptions().filter((p) => !p.available).map((p) => t(`checkout.methods.${p.id}.label`));
  const join = (xs: string[]) => xs.join(locale === "bn" ? ", " : ", ");
  const paymentAnswer = locale === "bn"
    ? `এখন যে পদ্ধতিগুলো চালু: ${join(on)}। ক্যাশ অন ডেলিভারি শুধু বাংলাদেশে।${soon.length ? ` শিগগির আসছে: ${join(soon)}।` : ""}`
    : `Available now: ${join(on)}. Cash on delivery is for Bangladesh only.${soon.length ? ` Coming soon: ${join(soon)}.` : ""}`;
  const groups = base.groups.map((g, gi) => (gi === 2 ? { ...g, items: g.items.map((it, ii) => (ii === 0 ? { ...it, a: paymentAnswer } : it)) } : g));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "bn" ? "bn-BD" : "en",
    mainEntity: groups.flatMap((g) => g.items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } }))),
  };

  return (
    <div className="container-x pb-24 pt-14 md:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="label text-stone">{base.eyebrow}</p>
      <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none text-ink md:text-8xl">{base.title}</h1>
      <p className="mt-6 max-w-xl text-lg text-stone">{base.intro}</p>

      <div className="mt-16 grid gap-14 md:grid-cols-12">
        <nav aria-label={base.title} className="md:col-span-3">
          <ul className="flex flex-wrap gap-2 md:sticky md:top-28 md:flex-col md:gap-1">
            {groups.map((g, i) => (
              <li key={g.h}><a href={`#faq-${i}`} className="block rounded-full px-4 py-2 text-sm text-ink hover:bg-sand">{g.h}</a></li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14 md:col-span-8 md:col-start-5">
          {groups.map((g, i) => (
            <Reveal key={g.h}>
              <section id={`faq-${i}`} className="scroll-mt-28">
                <h2 className="font-serif text-3xl text-ink md:text-4xl">{g.h}</h2>
                <div className="mt-5 divide-y divide-line border-y border-line">
                  {g.items.map((it) => (
                    <details key={it.q} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base font-medium text-ink">
                        {it.q}
                        <Plus className="mt-1 size-4 shrink-0 transition-transform duration-300 group-open:rotate-45" />
                      </summary>
                      <p className="mt-3 max-w-2xl leading-relaxed text-stone">{it.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
          <div className="rounded-[2px] bg-sand/60 p-6">
            <p className="font-serif text-2xl text-ink">{base.more}</p>
            <Link href="/contact" className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ivory">{base.contact}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
