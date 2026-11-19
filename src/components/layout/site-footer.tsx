import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

const COLUMNS = [
  {
    title: "footer.shop",
    links: [
      ["footer.women", "/shop?category=womens-fashion"],
      ["footer.men", "/shop?category=mens-fashion"],
      ["footer.kids", "/shop?category=kids-fashion"],
      ["footer.newArrivals", "/shop?sort=new"],
      ["footer.bags", "/shop?category=bags"],
    ],
  },
  {
    title: "footer.help",
    links: [
      ["footer.contact", "/contact"],
      ["footer.faq", "/faq"],
      ["footer.shipping", "/shipping-policy"],
      ["footer.returns", "/return-policy"],
      ["footer.track", "/track-order"],
    ],
  },
  {
    title: "footer.house",
    links: [
      ["footer.about", "/about"],
      ["footer.privacy", "/privacy-policy"],
      ["footer.terms", "/terms"],
    ],
  },
] as const;

export async function SiteFooter() {
  const { t, locale } = await getI18n();
  const year = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en", { useGrouping: false }).format(new Date().getFullYear());
  return (
    <footer className="border-t border-line bg-ivory">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p lang="en" className="font-serif text-5xl tracking-[0.2em] text-ink">DEMO</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone">{t("footer.tagline")}</p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title} className="md:col-span-2">
            <p className="label text-stone">{t(c.title)}</p>
            <ul className="mt-5 space-y-3">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink transition-opacity hover:opacity-60">{t(label)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line py-6 text-xs text-stone md:flex-row md:justify-between">
        <p>© {year} DEMO. {t("footer.rights")}</p>
        <p>{t("footer.prices")}</p>
      </div>
    </footer>
  );
}
