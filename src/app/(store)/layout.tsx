import { AnnouncementBar, SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreProvider } from "@/components/cart/store-provider";
import { CartDrawer } from "@/components/cart/cart-parts";
import { PageTransition } from "@/components/animations/page-transition";
import { getProducts } from "@/lib/catalog-source";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();
  return (
    <StoreProvider products={products}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
      <CartDrawer />
    </StoreProvider>
  );
}
