import "server-only";

/**
 * Courier adapters used by the admin dashboard (Phase 6) to book shipments.
 * Each reports unavailable until its credentials are set AND the integration
 * has been verified against the courier's sandbox. Until then staff choose
 * "Manual" and type the tracking number themselves.
 */
export type ShipmentRequest = {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string; // E.164
  address: string;
  city: string;
  codAmountBDT: number; // 0 when prepaid
  note?: string;
};
export type ShipmentResult = { courier: string; trackingNumber: string };

export interface CourierAdapter {
  id: "pathao" | "steadfast" | "manual";
  label: string;
  isAvailable(): boolean;
  createShipment(req: ShipmentRequest): Promise<ShipmentResult>;
}

const notVerified = (id: "pathao" | "steadfast", label: string, envs: string[]): CourierAdapter => ({
  id,
  label,
  // Flip to `envs.every(...)` only after a verified sandbox booking.
  isAvailable: () => false && envs.every((k) => Boolean(process.env[k])),
  async createShipment() {
    throw new Error(`${label} integration is not enabled yet.`);
  },
});

export const COURIERS: CourierAdapter[] = [
  notVerified("pathao", "Pathao Courier", ["PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET"]),
  notVerified("steadfast", "Steadfast Courier", ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"]),
  {
    id: "manual",
    label: "Manual (enter tracking number)",
    isAvailable: () => true,
    async createShipment(req) {
      return { courier: "manual", trackingNumber: req.orderNumber };
    },
  },
];
