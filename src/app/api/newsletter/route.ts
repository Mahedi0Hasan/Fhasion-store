import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation/newsletter";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/read-json";
import { serverT } from "@/lib/i18n/server";
import { translateMessage, DICTS } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const t = await serverT();
  const dict = DICTS[await getLocale()];
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: t("err.rate") }, { status: 429 });
  }

  const body = await readJson(req);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: translateMessage(dict, parsed.error.issues[0]?.message) || t("err.check") }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Honest failure: never pretend a subscription was stored.
    return NextResponse.json(
      { error: t("err.nlNotConnected") },
      { status: 503 },
    );
  }

  const res = await fetch(`${url}/rest/v1/newsletter_subscribers`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({ email: parsed.data.email }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: t("err.nlFailed") }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
