import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="container-x flex min-h-[60svh] flex-col items-start justify-center gap-5 py-24">
      <p className="label text-stone">404</p>
      <h1 className="font-serif text-6xl text-ink md:text-8xl">{t("notFound.title")}</h1>
      <p className="max-w-md text-stone">{t("notFound.body")}</p>
      <Link href="/shop" className="mt-2 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">{t("notFound.back")}</Link>
    </div>
  );
}
