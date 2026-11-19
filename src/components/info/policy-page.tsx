import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { getZones } from "@/lib/catalog-source";
import { POLICIES, POLICY_SLUGS, type PolicySlug } from "@/content/pages";
import { STORE } from "@/lib/store-info";
import { Reveal } from "@/components/animations/reveal";

export async function policyMetadata(slug: PolicySlug): Promise<Metadata> {
  const { locale } = await getI18n();
  const c = POLICIES[slug][locale];
  return { title: c.title, description: c.intro, alternates: { canonical: `/${slug}` } };
}

/** Shared layout for the four policy pages, with a side nav between them. */
export async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const { locale, t, money } = await getI18n();
  const c = POLICIES[slug][locale];
  const updated = new Date(STORE.policiesUpdated).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const zones = slug === "shipping-policy" ? await getZones() : [];
  const zoneLabel = (id: string, fallback: string) => { const v = t(`zones.${id}.label`); return v.startsWith("zones.") ? fallback : v; };
  const eta = (e: string) => { const v = t(`zones.eta.${e}`); return v.startsWith("zones.") ? e : v; };

  return (
    <div className="container-x grid gap-12 pb-24 pt-12 md:grid-cols-12 md:pt-16">
      <aside className="md:col-span-3">
        <nav aria-label={t("footer.help")} className="md:sticky md:top-28">
          <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1">
            {POLICY_SLUGS.map((s) => (
              <li key={s}>
                <Link
                  href={`/${s}`}
                  aria-current={s === slug ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm transition-colors ${s === slug ? "bg-ink text-ivory" : "text-ink hover:bg-sand"}`}
                >
                  {POLICIES[s][locale].title}
                </Link>
              </li>
            ))}
            <li><Link href="/faq" className="block rounded-full px-4 py-2 text-sm text-ink hover:bg-sand">{t("footer.faq")}</Link></li>
            <li><Link href="/contact" className="block rounded-full px-4 py-2 text-sm text-ink hover:bg-sand">{t("footer.contact")}</Link></li>
          </ul>
        </nav>
      </aside>

      <article className="md:col-span-8 md:col-start-5">
        <p className="label text-stone">{c.eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-ink md:text-7xl">{c.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone">{c.intro}</p>
        <p className="mt-4 text-xs text-stone">{t("info.updated", { date: updated })}</p>

        {slug === "shipping-policy" && zones.length > 0 && (
          <Reveal className="mt-12 overflow-hidden rounded-[2px] border border-line bg-ivory">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("info.zonesCaption")}</caption>
              <thead className="border-b border-line bg-sand/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("info.zone")}</th>
                  <th className="px-4 py-3 font-medium">{t("info.fee")}</th>
                  <th className="px-4 py-3 font-medium">{t("info.freeOver")}</th>
                  <th className="px-4 py-3 font-medium">{t("info.time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td className="px-4 py-3 text-ink">{zoneLabel(z.id, z.label)}</td>
                    <td className="px-4 py-3">{money(z.feeBDT)}</td>
                    <td className="px-4 py-3">{z.freeOverBDT ? money(z.freeOverBDT) : "—"}</td>
                    <td className="px-4 py-3">{eta(z.eta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}

        <div className="mt-12 space-y-10">
          {c.blocks.map((b, i) => (
            <section key={i}>
              {b.h && <h2 className="font-serif text-3xl text-ink">{b.h}</h2>}
              {b.p?.map((para, j) => <p key={j} className="mt-3 max-w-2xl leading-relaxed text-stone">{para}</p>)}
              {b.list && (
                <ul className="mt-4 max-w-2xl space-y-2.5">
                  {b.list.map((li, j) => (
                    <li key={j} className="flex gap-3 leading-relaxed text-stone">
                      <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-clay" />
                      {li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-[2px] bg-sand/60 p-6">
          <p className="font-serif text-2xl text-ink">{t("info.questions")}</p>
          <p className="mt-2 text-sm text-stone">{t("info.questionsBody")}</p>
          <Link href="/contact" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ivory">{t("footer.contact")}</Link>
        </div>
      </article>
    </div>
  );
}
