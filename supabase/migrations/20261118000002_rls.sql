-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security
-- • Public (anon) can read the active catalogue and shipping zones only.
-- • Orders, payments, coupons, subscribers: staff only. Customers never
--   touch these tables directly; writes go through SECURITY DEFINER
--   functions callable only by the server (service_role).
-- ═══════════════════════════════════════════════════════════════════════

alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.product_variants       enable row level security;
alter table public.inventory              enable row level security;
alter table public.shipping_zones         enable row level security;
alter table public.coupons                enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.order_events           enable row level security;
alter table public.payments               enable row level security;
alter table public.payment_events         enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- profiles: see yourself; admins see/manage everyone. No self-update (blocks role escalation).
create policy profiles_self_read  on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_all  on public.profiles for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- catalogue: public read of active rows; staff full access
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or public.is_staff());
create policy categories_staff_write on public.categories for all    to authenticated using (public.is_staff()) with check (public.is_staff());

create policy products_public_read on public.products for select to anon, authenticated using (is_active or public.is_staff());
create policy products_staff_write on public.products for all    to authenticated using (public.is_staff()) with check (public.is_staff());

create policy images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_staff())));
create policy images_staff_write on public.product_images for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy variants_public_read on public.product_variants for select to anon, authenticated
  using ((is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active)) or public.is_staff());
create policy variants_staff_write on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy inventory_public_read on public.inventory for select to anon, authenticated using (true);
create policy inventory_staff_write on public.inventory for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy zones_public_read on public.shipping_zones for select to anon, authenticated using (is_active or public.is_staff());
create policy zones_admin_write on public.shipping_zones for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- staff-only tables
create policy coupons_staff        on public.coupons      for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy orders_staff         on public.orders       for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy order_items_staff    on public.order_items  for select to authenticated using (public.is_staff());
create policy order_events_staff   on public.order_events for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy payments_staff       on public.payments     for select to authenticated using (public.is_staff());
create policy payment_events_admin on public.payment_events for select to authenticated using (public.is_admin());
create policy newsletter_staff     on public.newsletter_subscribers for select to authenticated using (public.is_staff());
-- (no anon policies on these tables ⇒ anon sees and writes nothing)
