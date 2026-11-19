import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { WishlistClient } from "./wishlist-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("wishlist.title"), robots: { index: false } };
}

export default function WishlistPage() {
  return <WishlistClient />;
}
