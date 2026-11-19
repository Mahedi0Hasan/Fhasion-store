import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE, DICTS, formatNumber, isCurrency, isLocale, LOCALE_COOKIE, makeMoney, translate, type Currency, type Locale } from "./index";
import { getUsdRate } from "@/lib/catalog-source";

/** Cookie wins; otherwise a Bangla-first browser gets Bangla; everyone else English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^\s*bn\b/i.test(al) ? "bn" : "en";
});

/** Display currency: USD only when chosen AND a rate is configured; otherwise BDT. */
export const getCurrency = cache(async (): Promise<{ currency: Currency; bdtPerUsd: number | null; rateUpdatedAt: string | null }> => {
  const rate = await getUsdRate().catch(() => null);
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return { currency: isCurrency(c) && c === "USD" && rate ? "USD" : "BDT", bdtPerUsd: rate?.bdtPerUsd ?? null, rateUpdatedAt: rate?.updatedAt ?? null };
});

export async function getI18n() {
  const locale = await getLocale();
  const dict = DICTS[locale];
  const cur = await getCurrency();
  const { money, bdt } = makeMoney(locale, cur.currency, cur.bdtPerUsd);
  return {
    locale,
    dict,
    ...cur,
    t: (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars),
    /** Display price in the visitor's chosen currency. */
    money,
    /** Always BDT: use for anything that is charged or recorded. */
    bdt,
    num: (n: number) => formatNumber(n, locale),
  };
}

/** For route handlers / actions that answer the browser directly. */
export async function serverT() {
  const { t } = await getI18n();
  return t;
}
