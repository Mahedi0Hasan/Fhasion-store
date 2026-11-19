import type { Metadata } from "next";
import { TrackForm } from "./track-form";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("track.meta"), description: t("track.intro") };
}

export default async function TrackOrderPage() {
  const { t } = await getI18n();
  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      <p className="label text-stone">{t("track.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none text-ink md:text-7xl">{t("track.title")}</h1>
      <p className="mt-4 text-stone">{t("track.intro")}</p>
      <TrackForm />
    </div>
  );
}
