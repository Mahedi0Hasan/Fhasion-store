import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/inter";
// Bengali glyphs: browsers fall back to these per character (Latin text keeps Cormorant/Inter).
import "@fontsource/noto-serif-bengali/400.css";
import "@fontsource/noto-serif-bengali/500.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "./globals.css";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("meta.title"), template: "%s · DEMO" },
    description: t("meta.desc"),
    openGraph: { type: "website", siteName: "DEMO", title: t("meta.title"), description: t("meta.desc"), locale: locale === "bn" ? "bn_BD" : "en_US" },
  };
}

export const viewport: Viewport = { themeColor: "#f6f0e6" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getI18n();
  return (
    <html lang={locale}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
