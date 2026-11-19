import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { isDbConfigured, serviceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { getI18n } from "@/lib/i18n/server";
import { translateMessage } from "@/lib/i18n";

export async function POST(req: Request) {
  const { t, dict, locale } = await getI18n();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`contact:${ip}`, 3, 10 * 60_000).ok) {
    return NextResponse.json({ error: t("err.rate") }, { status: 429 });
  }

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // A filled honeypot means a bot: pretend success, store nothing.
    if (issue?.path[0] === "website") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: translateMessage(dict, issue?.message) || t("err.check"), field: issue?.path[0] }, { status: 400 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: t("err.msgNotConnected") }, { status: 503 });

  const v = parsed.data;
  const { error } = await serviceClient().from("contact_messages").insert({
    name: v.name, email: v.email, phone: v.phone || null, topic: v.topic,
    order_number: v.order_number || null, message: v.message, locale,
  });
  if (error) {
    console.error("contact insert failed", error);
    return NextResponse.json({ error: t("err.msgFailed") }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
