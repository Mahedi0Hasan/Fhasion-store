"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/countries";
import { toE164 } from "@/lib/validation/checkout";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getI18n } from "@/lib/i18n/server";

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
  order_number: z.string().trim().toUpperCase().regex(/^DM-\d{6}-[0-9A-F]{6}$/, "err.trackFormat"),
  phone: z.string().trim().min(6).max(24),
  country: z.enum(COUNTRY_CODES).default("BD"),
});

export async function trackOrder(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const { t } = await getI18n();
  const ip = clientIp(await headers());
  if (!(await rateLimit(`track:${ip}`, 10, 60_000)).ok) return { error: t("err.rate") };
  if (!isDbConfigured()) return { error: t("err.trackNotConnected") };

  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) { const m = parsed.error.issues[0]?.message; return { error: m?.startsWith("err.") ? t(m) : t("err.check") }; }
  const phone = toE164(parsed.data.phone, parsed.data.country);
  if (!phone) return { error: t("err.trackPhone") };

  const { data, error } = await serviceClient().rpc("track_order", { p_order_number: parsed.data.order_number, p_phone: phone });
  if (error) return { error: t("err.trackFailed") };
  // Same message whether the number or the phone is wrong — don't reveal which.
  if (!data) return { error: t("err.trackNotFound") };
  return { order: data as TrackedOrder };
}
