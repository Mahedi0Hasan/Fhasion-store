"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAuthConfigured, userClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  next: z.string().regex(/^\/admin(\/[\w\-/]*)?$/).optional().catch(undefined),
});

export async function signIn(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  if (!isAuthConfigured()) return { error: "Admin sign-in isn't connected yet." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const parsed = schema.safeParse(Object.fromEntries(fd));
  // Limit by IP and by account to slow down password guessing.
  if (!rateLimit(`login:ip:${ip}`, 10, 15 * 60_000).ok || (parsed.success && !rateLimit(`login:acct:${parsed.data.email}`, 5, 15 * 60_000).ok)) {
    return { error: "Too many attempts. Please wait 15 minutes." };
  }
  if (!parsed.success) return { error: "Email or password is incorrect." };

  const db = await userClient();
  const { data, error } = await db.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) return { error: "Email or password is incorrect." };

  const { data: profile } = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (!profile?.role) {
    await db.auth.signOut();
    return { error: "This account doesn't have dashboard access." };
  }
  redirect(parsed.data.next ?? "/admin");
}

export async function signOut() {
  const db = await userClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
