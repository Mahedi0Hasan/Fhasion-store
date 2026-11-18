"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { CartLineRow, CartSummary } from "@/components/cart/cart-parts";
import { useStore } from "@/components/cart/store-provider";

export function CartPageClient() {
  const { lines, count, hydrated } = useStore();
  return (
    <div className="container-x py-14 md:py-20">
      <h1 className="font-serif text-5xl text-ink md:text-7xl">Your bag</h1>
      {!hydrated ? (
        <div className="mt-12 h-40 animate-pulse rounded bg-sand/60" aria-label="Loading bag" />
      ) : lines.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-5">
          <p className="text-stone">Your bag is empty.</p>
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">Discover the collection</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 md:grid-cols-12">
          <section aria-label="Items" className="md:col-span-7">
            <p className="label border-b border-line pb-4 text-stone">{count} {count === 1 ? "item" : "items"}</p>
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {lines.map((l) => <CartLineRow key={`${l.productId}-${l.size}`} line={l} />)}
              </AnimatePresence>
            </ul>
          </section>
          <aside aria-label="Order summary" className="md:col-span-4 md:col-start-9">
            <div className="sticky top-24 rounded-[2px] bg-ivory p-6">
              <p className="mb-5 font-serif text-2xl">Summary</p>
              <CartSummary />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
