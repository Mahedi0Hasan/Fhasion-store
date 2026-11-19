type T = (k: string, v?: Record<string, string | number>) => string;

/** The SQL coupon check answers in English; map its messages to the shopper's language. */
export function localizeCouponError(msg: string | undefined, t: T, money: (n: number) => string) {
  const m = (msg ?? "").trim();
  if (/isn't valid/i.test(m)) return t("err.couponInvalid");
  if (/expired/i.test(m)) return t("err.couponExpired");
  if (/limit/i.test(m)) return t("err.couponLimit");
  const min = m.match(/([\d,]+)/);
  if (/spend/i.test(m) && min) return t("err.couponMin", { amount: money(Number(min[1].replace(/,/g, ""))) });
  return t("err.couponInvalid");
}

/** "10% off" / "৳ 500 off" → localized label. */
export function localizeCouponLabel(label: string | undefined, t: T, money: (n: number) => string, num: (n: number) => string) {
  const pct = label?.match(/^(\d+)%/);
  if (pct) return t("cart.couponPercent", { n: num(Number(pct[1])) });
  const fixed = label?.match(/([\d,]+)/);
  if (fixed) return t("cart.couponFixed", { amount: money(Number(fixed[1].replace(/,/g, ""))) });
  return label ?? "";
}
