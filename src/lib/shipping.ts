/**
 * Shipping zones and fees (BDT). Configurable here until Phase 6 moves them
 * into store settings in the database. These are *estimates* shown in the
 * cart; checkout recalculates on the server.
 */
export const SHIPPING_ZONES = [
  { id: "dhaka", label: "Inside Dhaka", feeBDT: 80, freeOverBDT: 5000, eta: "1–2 days" },
  { id: "outside-dhaka", label: "Outside Dhaka", feeBDT: 150, freeOverBDT: 10000, eta: "2–4 days" },
  { id: "international", label: "International", feeBDT: 2500, freeOverBDT: undefined, eta: "7–14 days" },
] as const;

export type ShippingZoneId = (typeof SHIPPING_ZONES)[number]["id"];

export function shippingFor(zoneId: ShippingZoneId, subtotalBDT: number) {
  const z = SHIPPING_ZONES.find((s) => s.id === zoneId) ?? SHIPPING_ZONES[0];
  if (subtotalBDT === 0) return 0;
  if (z.freeOverBDT !== undefined && subtotalBDT >= z.freeOverBDT) return 0;
  return z.feeBDT;
}
