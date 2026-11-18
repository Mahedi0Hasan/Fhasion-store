-- ═══════════════════════════════════════════════════════════════════════
-- Order & payment functions
-- All money maths happens here, from database prices — never from the
-- client. Callable only by the server (service_role).
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────── coupons ─────────────
create or replace function public.evaluate_coupon(p_code text, p_subtotal int, p_lock boolean default false)
returns table (coupon_id uuid, code text, discount_bdt int, label text, error text)
language plpgsql security definer set search_path = public as $$
declare c public.coupons;
begin
  if p_lock then
    select * into c from public.coupons where coupons.code = upper(trim(p_code)) for update;
  else
    select * into c from public.coupons where coupons.code = upper(trim(p_code));
  end if;

  if c.id is null or not c.is_active or c.starts_at > now() then
    return query select null::uuid, null::text, 0, null::text, 'That code isn''t valid.'; return;
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return query select null::uuid, null::text, 0, null::text, 'That code has expired.'; return;
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return query select null::uuid, null::text, 0, null::text, 'That code has reached its limit.'; return;
  end if;
  if p_subtotal < c.min_subtotal_bdt then
    return query select null::uuid, null::text, 0, null::text,
      format('Spend ৳ %s or more to use this code.', to_char(c.min_subtotal_bdt, 'FM999,999,999')); return;
  end if;

  return query select
    c.id, c.code,
    least(p_subtotal,
          case when c.kind = 'percent' then least(round(p_subtotal * c.value / 100.0)::int, coalesce(c.max_discount_bdt, 2147483647))
               else c.value end),
    case when c.kind = 'percent' then c.value || '% off' else '৳ ' || c.value || ' off' end,
    null::text;
end $$;

-- ───────────── cart pricing (shared by quote + place_order) ─────────────
-- p_lines: [{ "product": "<uuid | legacy id>", "size": "M", "qty": 2 }, ...]
create or replace function public.price_lines(p_lines jsonb)
returns table (variant_id uuid, product_id uuid, product_name text, colour text, size text, sku text,
               unit_price_bdt int, quantity int, available int)
language sql stable security definer set search_path = public as $$
  with req as (
    select l->>'product' as product_ref, l->>'size' as size, sum((l->>'qty')::int) as qty
    from jsonb_array_elements(p_lines) l
    group by 1, 2
  )
  select v.id, p.id, p.name, p.colour, v.size, v.sku,
         coalesce(v.price_override_bdt, p.sale_price_bdt, p.price_bdt),
         req.qty::int, coalesce(i.quantity, 0)
  from req
  join public.products p on (p.id::text = req.product_ref or p.legacy_id = req.product_ref) and p.is_active
  join public.product_variants v on v.product_id = p.id and v.size = req.size and v.is_active
  left join public.inventory i on i.variant_id = v.id
$$;

create or replace function public.quote_cart(p_lines jsonb, p_coupon text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_sub int; c record;
begin
  select coalesce(sum(unit_price_bdt * least(quantity, available)), 0) into v_sub from public.price_lines(p_lines);
  if p_coupon is null or trim(p_coupon) = '' then
    return jsonb_build_object('subtotal_bdt', v_sub);
  end if;
  select * into c from public.evaluate_coupon(p_coupon, v_sub, false);
  return jsonb_build_object('subtotal_bdt', v_sub, 'code', c.code, 'discount_bdt', c.discount_bdt, 'label', c.label, 'error', c.error);
end $$;

-- ───────────── place order (atomic) ─────────────
create or replace function public.place_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing  public.orders;
  v_order     public.orders;
  v_customer  jsonb := p->'customer';
  v_country   text  := upper(v_customer->>'country');
  v_method    public.payment_method := (p->>'payment_method')::public.payment_method;
  v_zone      public.shipping_zones;
  v_line      record;
  v_lines     int := 0;
  v_requested int;
  v_sub       int := 0;
  v_coupon    record;
  v_coupon_code text;
  v_discount  int := 0;
  v_ship      int;
  v_number    text;
begin
  -- Idempotency: a retried submit returns the original order.
  if p->>'idempotency_key' is not null then
    select * into v_existing from public.orders where idempotency_key = p->>'idempotency_key';
    if v_existing.id is not null then
      return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number,
                                'total_bdt', v_existing.total_bdt, 'payment_method', v_existing.payment_method, 'duplicate', true);
    end if;
  end if;

  -- Zone must agree with the country (server never trusts a mismatched pair).
  select * into v_zone from public.shipping_zones where id = p->>'shipping_zone_id' and is_active;
  if v_zone.id is null
     or (v_country = 'BD' and v_zone.id not in ('dhaka', 'outside-dhaka'))
     or (v_country <> 'BD' and v_zone.id <> 'international') then
    raise exception 'INVALID_ZONE' using errcode = 'P0001';
  end if;
  if v_method = 'cod' and v_country <> 'BD' then
    raise exception 'COD_BD_ONLY' using errcode = 'P0001';
  end if;

  select count(*) into v_requested from (
    select distinct l->>'product', l->>'size' from jsonb_array_elements(p->'lines') l) s;
  if v_requested = 0 or v_requested > 50 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  -- Lock stock rows in a fixed order to avoid deadlocks, then validate.
  perform 1 from public.inventory i
   where i.variant_id in (select variant_id from public.price_lines(p->'lines'))
   order by i.variant_id for update;

  for v_line in select * from public.price_lines(p->'lines') loop
    v_lines := v_lines + 1;
    if v_line.quantity < 1 or v_line.quantity > 10 then
      raise exception 'INVALID_QTY:%', v_line.sku using errcode = 'P0001';
    end if;
    if v_line.available < v_line.quantity then
      raise exception 'OUT_OF_STOCK:%', v_line.sku using errcode = 'P0001';
    end if;
    v_sub := v_sub + v_line.unit_price_bdt * v_line.quantity;
  end loop;
  if v_lines <> v_requested then
    raise exception 'UNKNOWN_ITEM' using errcode = 'P0001';
  end if;

  if nullif(trim(p->>'coupon_code'), '') is not null then
    select * into v_coupon from public.evaluate_coupon(p->>'coupon_code', v_sub, true);
    if v_coupon.error is not null then
      raise exception 'COUPON:%', v_coupon.error using errcode = 'P0001';
    end if;
    v_discount := v_coupon.discount_bdt;
    v_coupon_code := v_coupon.code;
    update public.coupons set used_count = used_count + 1 where id = v_coupon.coupon_id;
  end if;

  v_ship := case when v_zone.free_over_bdt is not null and (v_sub - v_discount) >= v_zone.free_over_bdt then 0 else v_zone.fee_bdt end;

  -- Human-friendly, non-sequential order number; retry on the rare collision.
  loop
    v_number := 'DM-' || to_char(now() at time zone 'Asia/Dhaka', 'YYMMDD') || '-' ||
                upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;

  insert into public.orders (
    order_number, idempotency_key, payment_method, customer_name, email, phone, country,
    address_line1, address_line2, city, region, postal_code, notes,
    shipping_zone_id, subtotal_bdt, discount_bdt, shipping_bdt, total_bdt, coupon_code
  ) values (
    v_number, p->>'idempotency_key', v_method,
    v_customer->>'name', lower(v_customer->>'email'), v_customer->>'phone', v_country,
    v_customer->>'address_line1', nullif(v_customer->>'address_line2', ''), v_customer->>'city',
    nullif(v_customer->>'region', ''), nullif(v_customer->>'postal_code', ''), nullif(v_customer->>'notes', ''),
    v_zone.id, v_sub, v_discount, v_ship, v_sub - v_discount + v_ship, v_coupon_code
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, variant_id, product_name, colour, size, sku, unit_price_bdt, quantity, line_total_bdt)
  select v_order.id, l.product_id, l.variant_id, l.product_name, l.colour, l.size, l.sku, l.unit_price_bdt, l.quantity, l.unit_price_bdt * l.quantity
  from public.price_lines(p->'lines') l;

  update public.inventory i set quantity = i.quantity - l.quantity
  from public.price_lines(p->'lines') l where i.variant_id = l.variant_id;

  insert into public.payments (order_id, provider, amount_bdt) values (v_order.id, v_method, v_order.total_bdt);
  insert into public.order_events (order_id, status, note)
  values (v_order.id, 'pending', case when v_method = 'cod' then 'Order received — we will call to confirm.' else 'Awaiting payment.' end);

  return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number,
                            'total_bdt', v_order.total_bdt, 'payment_method', v_order.payment_method, 'duplicate', false);
end $$;

-- ───────────── cancel + restock (internal) ─────────────
create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null or o.status in ('cancelled', 'refunded', 'shipped', 'delivered') then return false; end if;
  update public.inventory i set quantity = i.quantity + oi.quantity
    from public.order_items oi where oi.order_id = o.id and oi.variant_id = i.variant_id;
  if o.coupon_code is not null then
    update public.coupons set used_count = greatest(used_count - 1, 0) where code = o.coupon_code;
  end if;
  update public.orders set status = 'cancelled',
         payment_status = case when payment_status = 'paid' then payment_status else 'cancelled' end
   where id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', p_reason);
  return true;
end $$;

-- Release stock held by online-payment orders that were never paid.
-- Schedule every 10 minutes with pg_cron in production (see README).
create or replace function public.release_unpaid_orders(p_older_than interval default '45 minutes')
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from public.orders
           where payment_method <> 'cod' and payment_status = 'pending' and status = 'pending'
             and created_at < now() - p_older_than
  loop
    if public.cancel_order(r.id, 'Payment not completed in time.') then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- ───────────── payment webhooks (idempotent) ─────────────
-- p_outcome: 'paid' | 'failed' | 'expired'
create or replace function public.apply_payment_event(
  p_provider public.payment_method, p_event_id text, p_payload jsonb,
  p_provider_ref text, p_outcome text, p_amount_bdt int)
returns text language plpgsql security definer set search_path = public as $$
declare pay public.payments; o public.orders; inserted int;
begin
  insert into public.payment_events (provider, event_id, payload) values (p_provider, p_event_id, p_payload)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return 'duplicate'; end if;

  select * into pay from public.payments where provider = p_provider and provider_ref = p_provider_ref for update;
  if pay.id is null then return 'unknown_payment'; end if;
  select * into o from public.orders where id = pay.order_id for update;

  if p_outcome = 'paid' then
    if p_amount_bdt is distinct from pay.amount_bdt then
      update public.payments set status = 'failed' where id = pay.id;
      insert into public.order_events (order_id, status, note) values (o.id, o.status, 'Payment amount mismatch — held for review.');
      return 'amount_mismatch';
    end if;
    if pay.status = 'paid' then return 'already_paid'; end if;
    update public.payments set status = 'paid' where id = pay.id;
    if o.status = 'cancelled' then
      -- Paid after the hold expired: keep it visible for staff to resolve.
      update public.orders set payment_status = 'paid' where id = o.id;
      insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Payment arrived after cancellation — refund or reinstate.');
      return 'paid_after_cancel';
    end if;
    update public.orders set payment_status = 'paid', status = 'confirmed' where id = o.id;
    insert into public.order_events (order_id, status, note) values (o.id, 'confirmed', 'Payment received.');
    return 'paid';
  elsif p_outcome in ('failed', 'expired') then
    if pay.status = 'paid' then return 'already_paid'; end if;
    update public.payments set status = case when p_outcome = 'failed' then 'failed'::public.payment_status else 'cancelled'::public.payment_status end where id = pay.id;
    perform public.cancel_order(o.id, case when p_outcome = 'failed' then 'Payment failed.' else 'Payment session expired.' end);
    return p_outcome;
  end if;
  return 'ignored';
end $$;

-- ───────────── guest order tracking ─────────────
-- Requires order number AND the phone used at checkout. Returns no address/email.
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'payment_status', o.payment_status,
    'payment_method', o.payment_method, 'created_at', o.created_at, 'total_bdt', o.total_bdt,
    'courier', o.courier, 'tracking_number', o.tracking_number,
    'items', (select jsonb_agg(jsonb_build_object('name', product_name, 'size', size, 'qty', quantity) order by created_at)
              from public.order_items where order_id = o.id),
    'events', (select jsonb_agg(jsonb_build_object('status', status, 'note', note, 'at', created_at) order by created_at)
               from public.order_events where order_id = o.id))
  from public.orders o
  where o.order_number = upper(trim(p_order_number)) and o.phone = p_phone
$$;

-- ───────────── lock down execution ─────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.evaluate_coupon(text,int,boolean)', 'public.price_lines(jsonb)', 'public.quote_cart(jsonb,text)',
    'public.place_order(jsonb)', 'public.cancel_order(uuid,text)', 'public.release_unpaid_orders(interval)',
    'public.apply_payment_event(public.payment_method,text,jsonb,text,text,int)', 'public.track_order(text,text)'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
-- is_staff / is_admin are evaluated inside RLS policies, including for anon
-- (where they simply return false), so every API role must be able to run them.
revoke all on function public.is_staff(), public.is_admin() from public;
grant execute on function public.is_staff(), public.is_admin() to anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated;
