-- ═══════════════════════════════════════════════════════════════════════
-- Admin dashboard support
-- Admin pages use the signed-in staff member's own JWT, so every read and
-- write below is still filtered by RLS / is_staff() checks in the database —
-- hiding a button in the UI is never the only protection.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────── order status changes ─────────────
create or replace function public.staff_update_order(
  p_order_id uuid, p_status public.order_status, p_note text default null,
  p_courier text default null, p_tracking text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;

  -- Allowed transitions
  if not (
       (o.status = 'pending'    and p_status in ('confirmed', 'processing', 'cancelled'))
    or (o.status = 'confirmed'  and p_status in ('processing', 'shipped', 'cancelled'))
    or (o.status = 'processing' and p_status in ('shipped', 'cancelled'))
    or (o.status = 'shipped'    and p_status in ('delivered'))
    or (o.status = 'delivered'  and p_status in ('refunded'))
    or (o.status = 'cancelled'  and p_status in ('refunded') and o.payment_status = 'paid')
    or (o.status = p_status)
  ) then
    raise exception 'BAD_TRANSITION:% → %', o.status, p_status using errcode = 'P0001';
  end if;
  if p_status = 'shipped' and coalesce(nullif(trim(p_tracking), ''), o.tracking_number) is null then
    raise exception 'TRACKING_REQUIRED' using errcode = 'P0001';
  end if;

  if p_status = 'cancelled' and o.status <> 'cancelled' then
    perform public.cancel_order(o.id, coalesce(nullif(trim(p_note), ''), 'Cancelled by staff.'));
  else
    update public.orders set
      status          = p_status,
      courier         = coalesce(nullif(trim(p_courier), ''), courier),
      tracking_number = coalesce(nullif(trim(p_tracking), ''), tracking_number),
      -- Cash on delivery is collected when the parcel is delivered.
      payment_status  = case
                          when p_status = 'delivered' and payment_method = 'cod' then 'paid'::public.payment_status
                          when p_status = 'refunded' then 'refunded'::public.payment_status
                          else payment_status end
    where id = o.id;
    if p_status = 'delivered' and o.payment_method = 'cod' then
      update public.payments set status = 'paid' where order_id = o.id and provider = 'cod';
    end if;
    if p_status <> o.status or nullif(trim(p_note), '') is not null then
      insert into public.order_events (order_id, status, note) values (o.id, p_status, nullif(trim(p_note), ''));
    end if;
  end if;

  select * into o from public.orders where id = p_order_id;
  return o;
end $$;

-- ───────────── dashboard numbers (runs with the caller's RLS) ─────────────
create or replace function public.staff_dashboard(p_days int default 30)
returns jsonb language sql stable security invoker set search_path = public as $$
  with live as (select * from public.orders where status not in ('cancelled', 'refunded'))
  select jsonb_build_object(
    'revenue_bdt',   coalesce((select sum(total_bdt) from live), 0),
    'orders',        (select count(*) from public.orders),
    'open_orders',   (select count(*) from public.orders where status in ('pending', 'confirmed', 'processing')),
    'customers',     (select count(distinct phone) from public.orders),
    'products',      (select count(*) from public.products),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'revenue_bdt', coalesce(r.rev, 0), 'orders', coalesce(r.n, 0)) order by d), '[]'::jsonb)
      from generate_series((now() at time zone 'Asia/Dhaka')::date - (p_days - 1), (now() at time zone 'Asia/Dhaka')::date, interval '1 day') d
      left join (select (created_at at time zone 'Asia/Dhaka')::date as od, sum(total_bdt) as rev, count(*) as n from live group by 1) r on r.od = d::date),
    'low_stock', (
      select coalesce(jsonb_agg(x order by x->>'quantity'), '[]'::jsonb) from (
        select jsonb_build_object('product', p.name, 'product_id', p.id, 'size', v.size, 'sku', v.sku, 'quantity', i.quantity) x
        from public.inventory i join public.product_variants v on v.id = i.variant_id join public.products p on p.id = v.product_id
        where i.quantity <= i.low_stock_threshold and v.is_active and p.is_active
        order by i.quantity limit 12) s),
    'top_products', (
      select coalesce(jsonb_agg(t order by (t->>'units')::int desc), '[]'::jsonb) from (
        select jsonb_build_object('name', oi.product_name, 'units', sum(oi.quantity), 'revenue_bdt', sum(oi.line_total_bdt)) t
        from public.order_items oi join live o on o.id = oi.order_id
        group by oi.product_name order by sum(oi.quantity) desc limit 5) s)
  )
$$;

-- ───────────── customers (guest checkout ⇒ grouped by phone) ─────────────
create or replace view public.staff_customers with (security_invoker = true) as
  select o.phone,
         (array_agg(o.customer_name order by o.created_at desc))[1] as name,
         (array_agg(o.email order by o.created_at desc))[1]          as email,
         (array_agg(o.city order by o.created_at desc))[1]           as city,
         o.country,
         count(*)                                                     as orders,
         coalesce(sum(o.total_bdt) filter (where o.status not in ('cancelled', 'refunded')), 0) as spent_bdt,
         max(o.created_at)                                            as last_order_at
  from public.orders o
  group by o.phone, o.country;

-- ───────────── grants ─────────────
revoke all on function public.staff_update_order(uuid, public.order_status, text, text, text) from public, anon;
grant execute on function public.staff_update_order(uuid, public.order_status, text, text, text) to authenticated, service_role;
revoke all on function public.staff_dashboard(int) from public, anon;
grant execute on function public.staff_dashboard(int) to authenticated, service_role;
revoke all on public.staff_customers from anon;
grant select on public.staff_customers to authenticated, service_role;

-- ───────────── product image storage (Supabase only) ─────────────
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    on conflict (id) do nothing;

    execute $p$create policy "product images: public read" on storage.objects for select to anon, authenticated
                using (bucket_id = 'product-images')$p$;
    execute $p$create policy "product images: staff upload" on storage.objects for insert to authenticated
                with check (bucket_id = 'product-images' and public.is_staff())$p$;
    execute $p$create policy "product images: staff update" on storage.objects for update to authenticated
                using (bucket_id = 'product-images' and public.is_staff())$p$;
    execute $p$create policy "product images: staff delete" on storage.objects for delete to authenticated
                using (bucket_id = 'product-images' and public.is_staff())$p$;
  end if;
end $$;
