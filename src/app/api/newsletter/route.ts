import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation/newsletter";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a minute." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Honest failure: never pretend a subscription was stored.
    return NextResponse.json(
      { error: "Sign-ups open once the store database is connected. Please check back soon." },
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
    return NextResponse.json({ error: "We couldn't save your email. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
