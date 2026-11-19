"use client";

import Link from "next/link";
import { useStore } from "@/components/cart/store-provider";
import { ProductCard } from "@/components/products/product-card";
import { useI18n } from "@/lib/i18n/client";

export function WishlistClient() {
  const { wishlist, hydrated, getProduct } = useStore();
  const { t } = useI18n();
  const items = wishlist.map(getProduct).filter((p) => p !== undefined);
  return (
    <div className="container-x py-14 md:py-20">
      <h1 className="font-serif text-5xl text-ink md:text-7xl">{t("wishlist.title")}</h1>
      <p className="mt-3 text-sm text-stone">{t("wishlist.device")}</p>
      {!hydrated ? null : items.length === 0 ? (
        <div className="mt-14 flex flex-col items-start gap-5">
          <p className="text-stone">{t("wishlist.empty")}</p>
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">{t("wishlist.browse")}</Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
