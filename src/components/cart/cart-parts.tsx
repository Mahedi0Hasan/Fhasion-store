"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Minus, Plus, Tag, X } from "lucide-react";
import { feeFor } from "@/lib/shipping/zones";
import { useI18n } from "@/lib/i18n/client";
import { useStore, type ResolvedLine } from "./store-provider";

export function QtyStepper({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  const { t, num } = useI18n();
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-ink/15" role="group" aria-label={label}>
      <button type="button" aria-label={t("cart.dec")} disabled={value <= 1} onClick={() => onChange(value - 1)} className="grid size-9 place-items-center disabled:opacity-30">
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">{num(value)}</span>
      <button type="button" aria-label={t("cart.inc")} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-9 place-items-center disabled:opacity-30">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CartLineRow({ line, compact = false }: { line: ResolvedLine; compact?: boolean }) {
  const { t, money: formatBDT } = useI18n();
  const { setQty, remove, closeDrawer } = useStore();
  const img = line.product.images[0];
  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.35 }} className="flex gap-4 py-5">
      <Link href={`/product/${line.product.slug}`} onClick={closeDrawer} className={`relative shrink-0 overflow-hidden bg-sand ${compact ? "h-28 w-22" : "h-36 w-28"}`}>
        <Image src={img.src} alt={img.alt} fill sizes="120px" style={img.position ? { objectPosition: img.position } : undefined} className={img.fit === "contain" ? "object-contain p-2" : "object-cover"} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.product.slug}`} onClick={closeDrawer} className="font-serif text-lg leading-tight text-ink">{line.product.name}</Link>
            <p className="mt-0.5 text-xs text-stone">{t("cart.sizeColour", { colour: line.product.colour, size: line.size })}</p>
          </div>
          <p className="shrink-0 text-sm font-medium text-ink">{formatBDT(line.lineTotal)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QtyStepper value={line.qty} max={line.available} onChange={(n) => setQty(line.productId, line.size, n)} label={t("cart.qtyFor", { name: line.product.name })} />
          <button type="button" onClick={() => remove(line.productId, line.size)} className="text-xs text-stone underline-offset-4 hover:text-ink hover:underline">
            {t("cart.remove")}
          </button>
        </div>
        {line.qty >= line.available && <p className="mt-2 text-[0.7rem] text-clay">{t("cart.maxAvail")}</p>}
      </div>
    </motion.li>
  );
}

export function CouponForm() {
  const { t } = useI18n();
  const { lines, coupon, setCoupon } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not a <form>: this block is also rendered inside the checkout form.
  async function apply() {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, lines: lines.map(({ productId, size, qty }) => ({ productId, size, qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("cart.couldntApply"));
      setCoupon({ code: data.code, discountBDT: data.discountBDT, label: data.label });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("cart.couldntApply"));
    } finally {
      setBusy(false);
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-full bg-sand px-4 py-2 text-sm">
        <span className="flex items-center gap-2"><Tag className="size-3.5" /> {coupon.code} · {coupon.label}</span>
        <button type="button" aria-label={t("cart.removeCode")} onClick={() => setCoupon(null)}><X className="size-4" /></button>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">{t("cart.code")}</label>
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} placeholder={t("cart.code")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-full border border-ink/15 bg-transparent px-4 text-sm uppercase placeholder:normal-case placeholder:text-stone/70 focus:border-ink focus:outline-none" />
        <button type="button" onClick={apply} disabled={busy || !code.trim()} className="h-10 rounded-full border border-ink px-5 text-xs font-medium transition-colors hover:bg-ink hover:text-ivory disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : t("cart.apply")}
        </button>
      </div>
      {error && <p role="alert" className="pl-4 text-xs text-clay">{error}</p>}
    </div>
  );
}

export function CartSummary({ showZones = true }: { showZones?: boolean }) {
  const { subtotal, coupon, closeDrawer, zones } = useStore();
  const { t, money: formatBDT, bdt, currency } = useI18n();
  const [zone, setZone] = useState("dhaka");
  const discount = coupon?.discountBDT ?? 0;
  const z = zones.find((s) => s.id === zone) ?? zones[0];
  const shipping = feeFor(z, subtotal - discount);
  const total = subtotal - discount + shipping;
  const zLabel = (id: string, fallback: string) => { const v = t(`zones.${id}.label`); return v.startsWith("zones.") ? fallback : v; };
  const eta = (e: string) => { const v = t(`zones.eta.${e}`); return v.startsWith("zones.") ? e : v; };

  return (
    <div className="space-y-4 text-sm">
      <CouponForm />
      <dl className="space-y-2.5 border-t border-line pt-4">
        <Row label={t("cart.subtotal")} value={formatBDT(subtotal)} />
        {discount > 0 && <Row label={t("cart.discount", { code: coupon!.code })} value={`− ${formatBDT(discount)}`} accent />}
        {showZones && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-stone">
              <label htmlFor="ship-zone">{t("cart.estimate")}</label>
            </dt>
            <dd>
              <select id="ship-zone" value={zone} onChange={(e) => setZone(e.target.value)} className="rounded-full border border-ink/15 bg-transparent py-1 pl-3 pr-7 text-xs focus:border-ink focus:outline-none">
                {zones.map((s) => <option key={s.id} value={s.id}>{zLabel(s.id, s.label)}</option>)}
              </select>
            </dd>
          </div>
        )}
        {z && <Row label={`${zLabel(z.id, z.label)} · ${eta(z.eta)}`} value={shipping === 0 ? t("cart.free") : formatBDT(shipping)} muted />}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-medium text-ink">{t("cart.estTotal")}</dt>
          <dd className="font-serif text-2xl text-ink">{formatBDT(total)}</dd>
        </div>
        {currency === "USD" && <p className="text-right text-[0.7rem] text-stone">{t("currency.chargedIn", { amount: bdt(total) })}</p>}
      </dl>
      {z?.freeOverBDT !== undefined && subtotal - discount < z.freeOverBDT && (
        <p className="text-xs text-stone">{t("cart.addMore", { amount: formatBDT(z.freeOverBDT - (subtotal - discount)), zone: t(`zones.${z.id}.inLabel`) })}</p>
      )}
      <Link
        href="/checkout"
        onClick={closeDrawer}
        className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-ink text-sm font-medium text-ivory"
      >
        <span className="absolute inset-0 origin-left scale-x-0 bg-clay transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-x-100" />
        <span className="relative">{t("cart.checkout")}</span>
      </Link>
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={muted ? "text-xs text-stone" : "text-stone"}>{label}</dt>
      <dd className={accent ? "text-clay" : muted ? "text-xs text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}

export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, count } = useStore();
  const { t, num } = useI18n();
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);
  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("cart.title")}
            data-cart-drawer=""
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ivory"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-6">
              <p className="font-serif text-2xl">{t("cart.title")} <span className="text-base text-stone">({num(count)})</span></p>
              <button type="button" aria-label={t("cart.close")} onClick={closeDrawer} className="-mr-2 grid size-10 place-items-center"><X className="size-5" strokeWidth={1.5} /></button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="font-serif text-3xl">{t("cart.empty")}</p>
                <p className="text-sm text-stone">{t("cart.emptyBody")}</p>
                <Link href="/shop" onClick={closeDrawer} className="mt-2 inline-flex h-11 items-center rounded-full bg-ink px-7 text-sm font-medium text-ivory">{t("cart.continue")}</Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => <CartLineRow key={`${l.productId}-${l.size}`} line={l} compact />)}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-line px-6 py-5">
                  <CartSummary showZones={false} />
                  <Link href="/cart" onClick={closeDrawer} className="mt-3 block text-center text-xs font-medium underline underline-offset-4">{t("cart.viewFull")}</Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
