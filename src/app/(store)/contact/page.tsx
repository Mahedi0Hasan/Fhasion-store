import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { STORE } from "@/lib/store-info";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("contact.meta"), description: t("contact.intro"), alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const { t, locale } = await getI18n();
  const address = STORE.address[locale] ?? STORE.address.en;
  // Only details that are actually configured are shown, never placeholders.
  const rows = [
    STORE.email && { Icon: Mail, label: t("contact.email"), value: STORE.email, href: `mailto:${STORE.email}` },
    STORE.phone && { Icon: Phone, label: t("contact.phone"), value: STORE.phone, href: `tel:${STORE.phone.replace(/\s/g, "")}` },
    STORE.whatsapp && { Icon: MessageCircle, label: t("contact.whatsapp"), value: t("contact.chat"), href: `https://wa.me/${STORE.whatsapp}` },
    address && { Icon: MapPin, label: t("contact.address"), value: address },
    { Icon: Clock, label: t("contact.hours"), value: STORE.hours[locale] },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href?: string }[];
  const [before, after] = t("contact.faqHint", { faq: "\u0000" }).split("\u0000");

  return (
    <div className="container-x grid gap-14 pb-24 pt-14 md:grid-cols-12 md:pt-20">
      <div className="md:col-span-5">
        <p className="label text-stone">{t("contact.eyebrow")}</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-ink md:text-7xl">{t("contact.title")}</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">{t("contact.intro")}</p>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {rows.map(({ Icon, label, value, href }) => (
            <li key={label} className="flex items-start gap-4 py-4">
              <Icon className="mt-0.5 size-4 shrink-0 text-clay" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-stone">{label}</p>
                {href ? (
                  <a href={href} className="text-ink underline-offset-4 hover:underline" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{value}</a>
                ) : (
                  <p className="text-ink">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-stone">{before}<Link href="/faq" className="text-ink underline underline-offset-4">{t("contact.faqLink")}</Link>{after}</p>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <div className="rounded-[2px] bg-ivory p-6 md:p-8">
          <h2 className="font-serif text-3xl text-ink">{t("contact.form")}</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
