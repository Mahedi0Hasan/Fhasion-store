-- Supabase security advisor: pin search_path on the updated_at trigger function.
alter function public.set_updated_at() set search_path = public;
