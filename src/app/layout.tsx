import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DEMO — Considered fashion, made to last",
    template: "%s · DEMO",
  },
  description:
    "DEMO is a premium fashion house offering tailored outerwear, leather goods and everyday essentials. Shipping across Bangladesh and worldwide.",
  openGraph: {
    type: "website",
    siteName: "DEMO",
    title: "DEMO — Considered fashion, made to last",
    description: "Tailored outerwear, leather goods and everyday essentials.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f0e6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
