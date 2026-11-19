import type { Metadata } from "next";
import { paymentOptions } from "@/lib/payments";
import { isDbConfigured } from "@/lib/supabase/admin";
import { hasOrderTokenSecret } from "@/lib/order-token";
import { CheckoutForm } from "./checkout-form";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("checkout.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const { t } = await getI18n();
  const ready = isDbConfigured() && hasOrderTokenSecret();
  return (
    <div className="container-x py-12 md:py-16">
      <h1 className="font-serif text-5xl text-ink md:text-7xl">{t("checkout.title")}</h1>
      {!ready && (
        <p role="status" className="mt-6 max-w-2xl rounded-[2px] border border-clay/30 bg-clay/10 px-5 py-4 text-sm text-ink">
          {t("checkout.notReady")}
        </p>
      )}
      <CheckoutForm ready={ready} payments={paymentOptions()} />
    </div>
  );
}
