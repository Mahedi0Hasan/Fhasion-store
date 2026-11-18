import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isAuthConfigured, userClient } from "@/lib/supabase/server";

export type Staff = { id: string; email: string; role: "staff" | "admin"; name: string | null };

/** The current user's staff profile, verified with the Auth server (not just the cookie). */
export const getStaff = cache(async (): Promise<Staff | null> => {
  if (!isAuthConfigured()) return null;
  const db = await userClient();
  const { data: { user } } = await db.auth.getUser(); // validates the JWT with Supabase Auth
  if (!user) return null;
  const { data: profile } = await db.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile?.role) return null;
  return { id: user.id, email: user.email ?? "", role: profile.role, name: profile.full_name };
});

export async function requireStaff() {
  const s = await getStaff();
  if (!s) redirect("/admin/login");
  return s;
}

export async function requireAdmin() {
  const s = await requireStaff();
  if (s.role !== "admin") redirect("/admin?denied=1");
  return s;
}
