import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DICTS, formatMoney, formatNumber, isLocale, LOCALE_COOKIE, translate, type Locale } from "./index";

/** Cookie wins; otherwise a Bangla-first browser gets Bangla; everyone else English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^\s*bn\b/i.test(al) ? "bn" : "en";
});

export async function getI18n() {
  const locale = await getLocale();
  const dict = DICTS[locale];
  return {
    locale,
    dict,
    t: (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars),
    money: (n: number) => formatMoney(n, locale),
    num: (n: number) => formatNumber(n, locale),
  };
}

/** For route handlers / actions that answer the browser directly. */
export async function serverT() {
  const { t } = await getI18n();
  return t;
}
