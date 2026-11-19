import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { CartPageClient } from "./cart-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t("cart.title"), robots: { index: false } };
}

export default function CartPage() {
  return <CartPageClient />;
}
