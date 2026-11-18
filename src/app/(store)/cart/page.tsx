import type { Metadata } from "next";
import { CartPageClient } from "./cart-client";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return <CartPageClient />;
}
