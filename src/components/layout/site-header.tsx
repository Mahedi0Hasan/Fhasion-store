"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { useI18n } from "@/lib/i18n/client";

const NAV = [
  { key: "nav.women", href: "/shop?category=womens-fashion" },
  { key: "nav.men", href: "/shop?category=mens-fashion" },
  { key: "nav.kids", href: "/shop?category=kids-fashion" },
  { key: "nav.collections", href: "/shop" },
  { key: "nav.journal", href: "/about" },
];

export function AnnouncementBar() {
  const { t } = useI18n();
  const ANNOUNCEMENTS = [0, 1, 2].map((n) => t(`announce.${n}`));
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-9 overflow-hidden bg-ink text-ivory">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 grid place-items-center px-4 text-center text-[0.72rem] tracking-wide"
        >
          {ANNOUNCEMENTS[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { count, wishlist, openDrawer, closeDrawer, hydrated } = useStore();
  const { t } = useI18n();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    setOpen(false);
    closeDrawer();
  }, [pathname, closeDrawer]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled ? "bg-cream/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-cream"
        }`}
      >
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[4.25rem]">
          {/* Left */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="-ml-2 grid size-10 place-items-center md:hidden"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-7">
                {NAV.slice(0, 4).map((n) => (
                  <li key={t(n.key)}>
                    <NavLink href={n.href}>{t(n.key)}</NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Logo */}
          <Link href="/" lang="en" aria-label={t("nav.home")} className="font-serif text-[1.9rem] leading-none tracking-[0.28em] text-ink md:text-[2.1rem]">
            DEMO
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1.5">
            <CurrencySwitch className="hidden sm:inline-flex" />
            <LangSwitch className="inline-flex h-10 items-center rounded-full px-2 text-[0.75rem] font-medium tracking-wide transition-colors hover:bg-sand sm:px-3 sm:text-[0.78rem]" />
            <IconLink href="/shop#search" label={t("nav.search")}><Search className="size-[1.15rem]" strokeWidth={1.5} /></IconLink>
            <IconLink href="/wishlist" label={t("nav.wishlist", { n: wishlist.length })} className="hidden sm:grid">
              <span className="relative">
                <Heart className="size-[1.15rem]" strokeWidth={1.5} />
                {hydrated && wishlist.length > 0 && <Dot n={wishlist.length} />}
              </span>
            </IconLink>
            <button type="button" onClick={openDrawer} aria-label={t("nav.bag", { n: count })} className="grid size-10 place-items-center rounded-full transition-colors hover:bg-sand">
              <span className="relative">
                <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
                <AnimatePresence>
                  {hydrated && count > 0 && <Dot key={count} n={count} />}
                </AnimatePresence>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.menu")}
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-cream px-6 pb-8 pt-4 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-12 items-center justify-between">
                <span lang="en" className="font-serif text-2xl tracking-[0.28em]">DEMO</span>
                <button type="button" aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)} className="-mr-2 grid size-10 place-items-center">
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </div>
              <ul className="mt-10 space-y-1">
                {NAV.map((n, i) => (
                  <motion.li
                    key={t(n.key)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={n.href} className="block py-2 font-serif text-4xl text-ink">
                      {t(n.key)}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-3 border-t border-line pt-6 text-sm text-stone">
                <Link href="/track-order" className="block">{t("nav.track")}</Link>
                <Link href="/wishlist" className="block">{t("nav.wishlistLink")}</Link>
                <Link href="/contact" className="block">{t("nav.contact")}</Link>
                <div className="flex items-center justify-between pt-2"><span>{t("currency.label")}</span><CurrencySwitch className="inline-flex" /></div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative py-1 text-[0.8rem] font-medium tracking-wide text-ink">
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-[var(--ease-soft)] group-hover:origin-left group-hover:scale-x-100" />
    </Link>
  );
}

function IconLink({ href, label, className = "grid", children }: { href: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={`${className} size-10 place-items-center rounded-full transition-colors hover:bg-sand`}>
      {children}
    </Link>
  );
}

function Dot({ n }: { n: number }) {
  const { num } = useI18n();
  return (
    <motion.span
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.4, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-ink text-[0.6rem] font-medium text-ivory"
    >
      {n > 9 ? `${num(9)}+` : num(n)}
    </motion.span>
  );
}

/** Toggles EN ⇄ বাংলা. Saved in a cookie so the server renders the chosen language. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale, t, switching } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
      aria-label={t("lang.switchLabel")}
      lang={locale === "bn" ? "en" : "bn"}
      disabled={switching}
      className={`${className} disabled:opacity-50`}
    >
      <span className="sm:hidden">{t("lang.short")}</span>
      <span className="hidden sm:inline">{t("lang.switchTo")}</span>
    </button>
  );
}

/** ৳ / $ toggle. Display only: checkout always charges BDT. Hidden when no rate is configured. */
export function CurrencySwitch({ className = "" }: { className?: string }) {
  const { currency, setCurrency, bdtPerUsd, t, switching } = useI18n();
  if (!bdtPerUsd) return null;
  return (
    <div role="group" aria-label={t("currency.label")} className={`${className} items-center rounded-full border border-ink/15 p-0.5 text-[0.72rem] font-medium`}>
      {(["BDT", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          disabled={switching}
          aria-pressed={currency === c}
          aria-label={t("currency.switchLabel", { c: t(`currency.${c.toLowerCase()}`) })}
          onClick={() => currency !== c && setCurrency(c)}
          className={`h-8 min-w-9 rounded-full px-2.5 transition-colors ${currency === c ? "bg-ink text-ivory" : "text-ink hover:bg-sand"}`}
        >
          {c === "BDT" ? "৳" : "$"}
        </button>
      ))}
    </div>
  );
}
