import "server-only";

/**
 * Demo coupon table. Server-only so codes can't be enumerated from the
 * bundle. Phase 4 replaces this with the `coupons` table.
 */
type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSubtotalBDT: number;
  maxDiscountBDT?: number;
  expiresAt: string;
};

const COUPONS: Coupon[] = [
  { code: "WELCOME10", kind: "percent", value: 10, minSubtotalBDT: 3000, maxDiscountBDT: 2000, expiresAt: "2027-12-31" },
  { code: "DEMO500", kind: "fixed", value: 500, minSubtotalBDT: 10000, expiresAt: "2027-12-31" },
];

export function evaluateCoupon(rawCode: string, subtotalBDT: number) {
  const code = rawCode.trim().toUpperCase();
  const c = COUPONS.find((x) => x.code === code);
  if (!c) return { ok: false as const, error: "That code isn't valid." };
  if (new Date(c.expiresAt) < new Date()) return { ok: false as const, error: "That code has expired." };
  if (subtotalBDT < c.minSubtotalBDT) {
    return { ok: false as const, error: `Spend ৳ ${c.minSubtotalBDT.toLocaleString("en-IN")} or more to use this code.` };
  }
  let discount = c.kind === "percent" ? Math.round((subtotalBDT * c.value) / 100) : c.value;
  if (c.maxDiscountBDT) discount = Math.min(discount, c.maxDiscountBDT);
  discount = Math.min(discount, subtotalBDT);
  return { ok: true as const, code: c.code, discountBDT: discount, label: c.kind === "percent" ? `${c.value}% off` : `৳ ${c.value} off` };
}
