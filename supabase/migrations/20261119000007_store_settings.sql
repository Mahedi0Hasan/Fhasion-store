-- Store-wide settings that admins can change without a redeploy.
-- Only keys listed as public are readable by visitors; everything else is admin-only.
create table public.store_settings (
  key         text primary key check (key ~ '^[a-z_]+$'),
  value       jsonb not null,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now()
);
create trigger set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;
create policy store_settings_public_read on public.store_settings for select to anon, authenticated using (is_public or public.is_admin());
create policy store_settings_admin_write on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Display-only USD rate: how many taka one US dollar is worth. Payments are always charged in BDT.
insert into public.store_settings (key, value, is_public)
values ('usd_rate', jsonb_build_object('bdt_per_usd', 122), true)
on conflict (key) do nothing;

-- Sanity bounds so a typo can't show absurd prices.
alter table public.store_settings add constraint usd_rate_sane check (
  key <> 'usd_rate' or ((value->>'bdt_per_usd')::numeric between 50 and 500)
);
