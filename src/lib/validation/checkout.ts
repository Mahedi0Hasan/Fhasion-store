import { z } from "zod";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { COUNTRY_CODES } from "@/lib/countries";
import { cartLineSchema } from "./cart";

export const PAYMENT_METHODS = ["cod", "bkash", "nagad", "stripe"] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number];

/** Normalise a phone number to E.164 for the given country, or null. */
export function toE164(raw: string, country: string) {
  const p = parsePhoneNumberFromString(raw.trim(), country as CountryCode);
  return p && p.isValid() ? p.number : null;
}

// Messages are dictionary keys ("err.*"), translated wherever they're shown.
const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, "err.tooLong");

/** Shared by the checkout form (client) and /api/orders (server). */
export const checkoutSchema = z
  .object({
    name: text(2, 120, "err.name"),
    email: z.string().trim().toLowerCase().email("err.email").max(254),
    country: z.enum(COUNTRY_CODES, { error: "err.country" }),
    phone: z.string().trim().min(6, "err.phoneMissing").max(24),
    address_line1: text(3, 200, "err.address"),
    address_line2: z.string().trim().max(200).optional().or(z.literal("")),
    city: text(2, 80, "err.city"),
    region: z.string().trim().max(80).optional().or(z.literal("")),
    postal_code: z.string().trim().max(20).optional().or(z.literal("")),
    delivery_area: z.enum(["dhaka", "outside-dhaka"]).optional(),
    payment_method: z.enum(PAYMENT_METHODS, { error: "err.method" }),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    coupon_code: z.string().trim().max(32).optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (!toE164(v.phone, v.country)) {
      ctx.addIssue({ path: ["phone"], code: "custom", message: v.country === "BD" ? "err.phoneBD" : "err.phoneIntl" });
    }
    if (v.country === "BD" && !v.delivery_area) ctx.addIssue({ path: ["delivery_area"], code: "custom", message: "err.area" });
    if (v.payment_method === "cod" && v.country !== "BD") ctx.addIssue({ path: ["payment_method"], code: "custom", message: "err.codBD" });
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderRequestSchema = z.object({
  idempotency_key: z.string().uuid(),
  form: checkoutSchema,
  lines: z.array(cartLineSchema).min(1).max(50),
});

export function zoneFor(country: string, area?: "dhaka" | "outside-dhaka") {
  if (country !== "BD") return "international" as const;
  return area ?? "outside-dhaka";
}
