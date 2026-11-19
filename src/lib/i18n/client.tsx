"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DICTS, formatMoney, formatNumber, LOCALE_COOKIE, translate, translateMessage, type Locale } from "./index";

type Ctx = {
  locale: Locale;
  dict: (typeof DICTS)[Locale];
  t: (key: string, vars?: Record<string, string | number>) => string;
  tm: (msg: string | undefined, vars?: Record<string, string | number>) => string;
  money: (n: number) => string;
  num: (n: number) => string;
  setLocale: (l: Locale) => void;
  switching: boolean;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
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

  const value = useMemo<Ctx>(
    () => ({
      locale,
      dict,
      t: (k, v) => translate(dict, k, v),
      tm: (m, v) => translateMessage(dict, m, v),
      money: (n) => formatMoney(n, locale),
      num: (n) => formatNumber(n, locale),
      setLocale,
      switching,
    }),
    [locale, dict, setLocale, switching],
  );
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n must be used inside <I18nProvider>");
  return c;
}
