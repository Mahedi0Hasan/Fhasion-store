import "server-only";
import type { PaymentMethodId } from "@/lib/validation/checkout";
import type { PaymentAdapter } from "./types";
import { stripeAdapter } from "./stripe";

const codAdapter: PaymentAdapter = {
  id: "cod",
  label: "Cash on delivery",
  description: "Pay the courier in cash when your order arrives. We'll call to confirm first.",
  isAvailable: () => true,
  supportsCountry: (c) => c === "BD",
  start: async () => ({ kind: "none" }),
};

/**
 * bKash & Nagad: adapters are registered so the UI and order flow know about
 * them, but they report unavailable until a merchant account is issued and the
 * tokenized-checkout integration has been built and verified against the
 * provider sandbox. We never fake a successful payment.
 */
function pendingProvider(id: "bkash" | "nagad", label: string): PaymentAdapter {
  return {
    id,
    label,
    description: "Coming soon.",
    isAvailable: () => false,
    supportsCountry: (c) => c === "BD",
    start: async () => {
      throw new Error(`${label} is not configured yet.`);
    },
  };
}

export const PAYMENT_ADAPTERS: Record<PaymentMethodId, PaymentAdapter> = {
  cod: codAdapter,
  bkash: pendingProvider("bkash", "bKash"),
  nagad: pendingProvider("nagad", "Nagad"),
  stripe: stripeAdapter,
};

export type PaymentOption = { id: PaymentMethodId; label: string; description: string; available: boolean; countries: "BD" | "all" };

/** Serializable list for the checkout UI. */
export function paymentOptions(): PaymentOption[] {
  return Object.values(PAYMENT_ADAPTERS).map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description,
    available: a.isAvailable(),
    countries: a.supportsCountry("US") ? "all" : "BD",
  }));
}
