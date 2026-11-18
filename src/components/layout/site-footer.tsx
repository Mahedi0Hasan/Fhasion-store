import Link from "next/link";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      ["Women", "/shop?category=womens-fashion"],
      ["Men", "/shop?category=mens-fashion"],
      ["Kids", "/shop?category=kids-fashion"],
      ["New arrivals", "/shop?sort=new"],
      ["Bags & accessories", "/shop?category=bags"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Contact", "/contact"],
      ["FAQ", "/faq"],
      ["Shipping policy", "/shipping-policy"],
      ["Returns & refunds", "/return-policy"],
      ["Track an order", "/account/orders"],
    ],
  },
  {
    title: "House",
    links: [
      ["About DEMO", "/about"],
      ["Privacy policy", "/privacy-policy"],
      ["Terms & conditions", "/terms"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ivory">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="font-serif text-5xl tracking-[0.2em] text-ink">DEMO</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone">
            Considered clothing and leather goods, designed in Dhaka and shipped worldwide.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title} className="md:col-span-2">
            <p className="label text-stone">{c.title}</p>
            <ul className="mt-5 space-y-3">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink transition-opacity hover:opacity-60">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line py-6 text-xs text-stone md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} DEMO. All rights reserved.</p>
        <p>Prices in BDT · USD available at checkout</p>
      </div>
    </footer>
  );
}
