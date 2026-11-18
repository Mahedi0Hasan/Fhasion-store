import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — use ONLY in server code (route
 * handlers, server actions) and only to call the locked-down SQL functions
 * or for admin operations that have already checked authorization.
 */
let cached: SupabaseClient | null = null;

export function isDbConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function serviceClient(): SupabaseClient {
  if (!isDbConfigured()) throw new Error("Supabase is not configured");
  cached ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
