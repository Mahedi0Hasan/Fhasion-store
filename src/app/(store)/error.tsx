"use client";

import { useI18n } from "@/lib/i18n/client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container-x flex min-h-[50svh] flex-col items-start justify-center gap-5 py-24">
      <h1 className="font-serif text-5xl text-ink">{t("error.title")}</h1>
      <p className="text-stone">{t("error.body")}</p>
      <button type="button" onClick={reset} className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">{t("error.retry")}</button>
    </div>
  );
}
