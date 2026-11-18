"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

const NAV = [
  { label: "Women", href: "/shop?category=womens-fashion" },
  { label: "Men", href: "/shop?category=mens-fashion" },
  { label: "Kids", href: "/shop?category=kids-fashion" },
  { label: "Collections", href: "/collections" },
  { label: "Journal", href: "/about" },
];

const ANNOUNCEMENTS = [
  "Free delivery inside Dhaka on orders over ৳ 5,000",
  "Worldwide shipping — prices shown in BDT & USD",
  "Easy 7-day returns on all full-price pieces",
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ANNOUNCEMENTS.length), 4500);
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
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => setOpen(false), [pathname]);
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
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="-ml-2 grid size-10 place-items-center md:hidden"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-7">
                {NAV.slice(0, 4).map((n) => (
                  <li key={n.label}>
                    <NavLink href={n.href}>{n.label}</NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Logo */}
          <Link href="/" aria-label="DEMO home" className="font-serif text-[1.9rem] leading-none tracking-[0.28em] text-ink md:text-[2.1rem]">
            DEMO
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1.5">
            <IconLink href="/shop" label="Search"><Search className="size-[1.15rem]" strokeWidth={1.5} /></IconLink>
            <IconLink href="/account" label="Account" className="hidden sm:grid"><User className="size-[1.15rem]" strokeWidth={1.5} /></IconLink>
            <IconLink href="/account/wishlist" label="Wishlist" className="hidden sm:grid"><Heart className="size-[1.15rem]" strokeWidth={1.5} /></IconLink>
            <IconLink href="/cart" label="Bag, 0 items">
              <span className="relative">
                <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} />
                <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-ink text-[0.6rem] font-medium text-ivory">0</span>
              </span>
            </IconLink>
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
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-cream px-6 pb-8 pt-4 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-12 items-center justify-between">
                <span className="font-serif text-2xl tracking-[0.28em]">DEMO</span>
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="-mr-2 grid size-10 place-items-center">
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </div>
              <ul className="mt-10 space-y-1">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={n.href} className="block py-2 font-serif text-4xl text-ink">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-3 border-t border-line pt-6 text-sm text-stone">
                <Link href="/account" className="block">Account</Link>
                <Link href="/account/wishlist" className="block">Wishlist</Link>
                <Link href="/contact" className="block">Contact</Link>
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
