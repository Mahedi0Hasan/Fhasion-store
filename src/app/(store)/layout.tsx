import { AnnouncementBar, SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreProvider } from "@/components/cart/store-provider";
import { CartDrawer } from "@/components/cart/cart-parts";
import { PageTransition } from "@/components/animations/page-transition";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { getLocalizedCatalog } from "@/lib/catalog-source";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  const { products, zones } = await getLocalizedCatalog(locale);
  return (
    <I18nProvider locale={locale}>
      <StoreProvider products={products} zones={zones}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
          {t("nav.skip")}
        </a>
        <AnnouncementBar />
        <SiteHeader />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <CartDrawer />
      </StoreProvider>
    </I18nProvider>
  );
}
