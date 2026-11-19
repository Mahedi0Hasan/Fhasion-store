-- Shared rate limiting for serverless deployments, where in-memory counters
-- don't survive between requests. Fixed windows, one row per key per window.
create table public.rate_limits (
  key           text not null check (char_length(key) <= 200),
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security; -- no policies: server only

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, v_start, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_limit;
end $$;

create or replace function public.prune_rate_limits() returns int
language sql security definer set search_path = public as $$
  with d as (delete from public.rate_limits where window_start < now() - interval '1 day' returning 1)
  select count(*)::int from d
$$;

revoke all on function public.hit_rate_limit(text, int, int), public.prune_rate_limits() from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int), public.prune_rate_limits() to service_role;
