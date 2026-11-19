"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CartLineRow, CartSummary } from "@/components/cart/cart-parts";
import { useStore } from "@/components/cart/store-provider";
import { useI18n } from "@/lib/i18n/client";

export function CartPageClient() {
  const { lines, count, hydrated } = useStore();
  const { t, num } = useI18n();
  return (
    <div className="container-x py-14 md:py-20">
      <h1 className="font-serif text-5xl text-ink md:text-7xl">{t("cart.title")}</h1>
      {!hydrated ? (
        <div className="mt-12 h-40 animate-pulse rounded bg-sand/60" aria-label={t("cart.loading")} />
      ) : lines.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-5">
          <p className="text-stone">{t("cart.emptyShort")}</p>
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">{t("cart.discover")}</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 md:grid-cols-12">
          <section aria-label={t("cart.title")} className="md:col-span-7">
            <p className="label border-b border-line pb-4 text-stone">{t(count === 1 ? "cart.item" : "cart.items", { n: num(count) })}</p>
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {lines.map((l) => <CartLineRow key={`${l.productId}-${l.size}`} line={l} />)}
              </AnimatePresence>
            </ul>
          </section>
          <aside aria-label={t("cart.summary")} className="md:col-span-4 md:col-start-9">
            <div className="sticky top-24 rounded-[2px] bg-ivory p-6">
              <p className="mb-5 font-serif text-2xl">{t("cart.summary")}</p>
              <CartSummary />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
