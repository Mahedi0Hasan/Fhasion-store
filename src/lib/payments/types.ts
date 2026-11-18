import type { PaymentMethodId } from "@/lib/validation/checkout";

export type PlacedOrder = {
  orderId: string;
  orderNumber: string;
  totalBDT: number;
  email: string;
  returnUrl: string; // signed confirmation URL
  cancelUrl: string;
};

/** What the browser should do next after the order row exists. */
export type PaymentStart =
  | { kind: "none" } // e.g. COD — go straight to confirmation
  | { kind: "redirect"; url: string; providerRef: string };

export interface PaymentAdapter {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** Credentials present AND the integration is implemented + verified. */
  isAvailable(): boolean;
  supportsCountry(country: string): boolean;
  start(order: PlacedOrder): Promise<PaymentStart>;
}
