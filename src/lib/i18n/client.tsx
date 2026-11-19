"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, DICTS, formatNumber, LOCALE_COOKIE, makeMoney, translate, translateMessage, type Currency, type Locale } from "./index";

type Ctx = {
  locale: Locale;
  dict: (typeof DICTS)[Locale];
  t: (key: string, vars?: Record<string, string | number>) => string;
  tm: (msg: string | undefined, vars?: Record<string, string | number>) => string;
  /** Display price in the chosen currency (USD is display-only). */
  money: (n: number) => string;
  /** Always BDT, for amounts that are charged. */
  bdt: (n: number) => string;
  num: (n: number) => string;
  setLocale: (l: Locale) => void;
  currency: Currency;
  bdtPerUsd: number | null;
  setCurrency: (c: Currency) => void;
  switching: boolean;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ locale, currency, bdtPerUsd, children }: { locale: Locale; currency: Currency; bdtPerUsd: number | null; children: React.ReactNode }) {
  const router = useRouter();
  const [switching, start] = useTransition();
  const dict = DICTS[locale];

  const setLocale = useCallback(
    (l: Locale) => {
      // Not httpOnly: it's a display preference, read on the server to render the right language.
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = l;
      start(() => router.refresh());
    },
    [router],
  );
  const setCurrency = useCallback(
    (c: Currency) => {
      document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      start(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<Ctx>(
    () => ({
      locale,
      dict,
      t: (k, v) => translate(dict, k, v),
      tm: (m, v) => translateMessage(dict, m, v),
      ...makeMoney(locale, currency, bdtPerUsd),
      num: (n) => formatNumber(n, locale),
      setLocale,
      currency,
      bdtPerUsd,
      setCurrency,
      switching,
    }),
    [locale, dict, setLocale, switching, currency, bdtPerUsd, setCurrency],
  );
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}
