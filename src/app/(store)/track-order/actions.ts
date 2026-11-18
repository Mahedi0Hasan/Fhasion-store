"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/countries";
import { toE164 } from "@/lib/validation/checkout";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export type TrackedOrder = {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  total_bdt: number;
  courier: string | null;
  tracking_number: string | null;
  items: { name: string; size: string; qty: number }[];
  events: { status: string; note: string | null; at: string }[];
};
export type TrackState = { error?: string; order?: TrackedOrder };

const schema = z.object({
  order_number: z.string().trim().toUpperCase().regex(/^DM-\d{6}-[0-9A-F]{6}$/, "Order numbers look like DM-261118-A1B2C3."),
  phone: z.string().trim().min(6).max(24),
  country: z.enum(COUNTRY_CODES).default("BD"),
});

export async function trackOrder(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`track:${ip}`, 10, 60_000).ok) return { error: "Too many attempts. Please wait a minute." };
  if (!isDbConfigured()) return { error: "Order tracking isn't connected yet. Please try again soon." };

  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const phone = toE164(parsed.data.phone, parsed.data.country);
  if (!phone) return { error: "Please enter the phone number used for the order." };

  const { data, error } = await serviceClient().rpc("track_order", { p_order_number: parsed.data.order_number, p_phone: phone });
  if (error) return { error: "We couldn't look that up right now. Please try again." };
  // Same message whether the number or the phone is wrong — don't reveal which.
  if (!data) return { error: "We couldn't find an order with that number and phone." };
  return { order: data as TrackedOrder };
}
