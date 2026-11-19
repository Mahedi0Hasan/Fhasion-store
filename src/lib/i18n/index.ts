import { en, type Dict } from "./dictionaries/en";
import { bn } from "./dictionaries/bn";

export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";
export const isLocale = (v: unknown): v is Locale => v === "en" || v === "bn";

export const DICTS: Record<Locale, Dict> = { en, bn };
export type { Dict };

/** Look up "a.b.c" in the dictionary and fill {placeholders}. Missing keys fall back to English, then the key itself. */
export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  const find = (d: unknown) => key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), d);
  let s = find(dict);
  if (typeof s !== "string") s = find(en);
  if (typeof s !== "string") return key;
  return vars ? (s as string).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : (s as string);
}

/** Locale-aware numbers: Bengali digits in Bangla. */
export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN").format(n);
}
export function formatMoney(n: number, locale: Locale) {
  return `৳ ${formatNumber(n, locale)}`;
}

/** Translate a validation/server message that may be a dictionary key ("err.name") or plain text. */
export function translateMessage(dict: Dict, msg: string | undefined, vars?: Record<string, string | number>) {
  if (!msg) return "";
  return msg.startsWith("err.") ? translate(dict, msg, vars) : msg;
}

/* ───────────── currency (display only) ───────────── */
export type Currency = "BDT" | "USD";
export const CURRENCY_COOKIE = "cur";
export const isCurrency = (v: unknown): v is Currency => v === "BDT" || v === "USD";

/** Convert a BDT amount for DISPLAY. Payments are always charged in BDT. */
export function formatUsdFromBdt(bdt: number, bdtPerUsd: number, locale: Locale) {
  // Built by hand: ICU's currency layout for bn differs between Node and browsers,
  // which would make server and client render different text.
  const n = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bdt / bdtPerUsd);
  return locale === "bn" ? `US$ ${n}` : `$${n}`;
}

export function makeMoney(locale: Locale, currency: Currency, bdtPerUsd: number | null) {
  const bdt = (n: number) => formatMoney(n, locale);
  const money = currency === "USD" && bdtPerUsd ? (n: number) => formatUsdFromBdt(n, bdtPerUsd, locale) : bdt;
  return { money, bdt };
}
