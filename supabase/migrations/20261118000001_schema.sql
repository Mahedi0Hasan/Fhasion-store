-- ═══════════════════════════════════════════════════════════════════════
-- DEMO — core schema
-- Guest-only storefront (no customer accounts, by decision 2026-11-18).
-- auth.users / profiles exist only for store staff (admin dashboard).
-- Spec tables carts, cart_items, wishlists, addresses and reviews are
-- intentionally omitted: they need customer accounts. Shipping addresses
-- are stored as a snapshot on each order.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────── types ─────────────
create type public.staff_role     as enum ('staff', 'admin');
create type public.order_status   as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
create type public.payment_method as enum ('cod', 'bkash', 'nagad', 'stripe');

-- ───────────── helpers ─────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────── staff profiles ─────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  role        public.staff_role,             -- null = no dashboard access
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- SECURITY DEFINER so it can read profiles regardless of the caller's RLS.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role is not null)
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- New auth users get a profile with NO role. Roles are granted by an admin
-- (or by SQL for the first admin) — never self-assigned.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── catalogue ─────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 80),
  parent_id   uuid references public.categories (id) on delete set null,
  sort        int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  legacy_id       text unique,                         -- id used by the demo catalogue (p1…)
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null check (char_length(name) between 1 and 120),
  description     text not null default '',
  details         text[] not null default '{}',
  category_id     uuid not null references public.categories (id) on delete restrict,
  gender          text not null check (gender in ('women', 'men', 'unisex', 'kids')),
  colour          text not null,
  colour_hex      text not null check (colour_hex ~ '^#[0-9a-fA-F]{6}$'),
  price_bdt       int  not null check (price_bdt > 0),
  sale_price_bdt  int  check (sale_price_bdt is null or (sale_price_bdt > 0 and sale_price_bdt < price_bdt)),
  is_active       boolean not null default true,
  is_new          boolean not null default false,
  is_bestseller   boolean not null default false,
  popularity      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_category_idx on public.products (category_id) where is_active;
create index products_created_idx  on public.products (created_at desc) where is_active;

create table public.product_images (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products (id) on delete cascade,
  src              text not null,                      -- Storage path or /public path
  alt              text not null default '',
  fit              text not null default 'cover' check (fit in ('contain', 'cover')),
  object_position  text,
  sort             int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort);

create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  size                text not null check (char_length(size) between 1 and 8),
  sku                 text not null unique check (sku ~ '^[A-Z0-9-]+$'),
  price_override_bdt  int check (price_override_bdt is null or price_override_bdt > 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (product_id, size)
);

create table public.inventory (
  variant_id           uuid primary key references public.product_variants (id) on delete cascade,
  quantity             int not null default 0 check (quantity >= 0),
  low_stock_threshold  int not null default 3 check (low_stock_threshold >= 0),
  updated_at           timestamptz not null default now()
);
create index inventory_low_idx on public.inventory (quantity) where quantity <= 3;

-- ───────────── commerce config ─────────────
create table public.shipping_zones (
  id             text primary key check (id ~ '^[a-z0-9-]+$'),
  label          text not null,
  fee_bdt        int not null check (fee_bdt >= 0),
  free_over_bdt  int check (free_over_bdt is null or free_over_bdt > 0),
  eta            text not null default '',
  is_active      boolean not null default true,
  sort           int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code = upper(code) and code ~ '^[A-Z0-9]{3,32}$'),
  kind              text not null check (kind in ('percent', 'fixed')),
  value             int  not null check (value > 0),
  min_subtotal_bdt  int  not null default 0 check (min_subtotal_bdt >= 0),
  max_discount_bdt  int  check (max_discount_bdt is null or max_discount_bdt > 0),
  usage_limit       int  check (usage_limit is null or usage_limit > 0),
  used_count        int  not null default 0 check (used_count >= 0),
  starts_at         timestamptz not null default now(),
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100),
  check (usage_limit is null or used_count <= usage_limit)
);

-- ───────────── orders ─────────────
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  idempotency_key   text unique check (char_length(idempotency_key) <= 64),
  status            public.order_status   not null default 'pending',
  payment_method    public.payment_method not null,
  payment_status    public.payment_status not null default 'pending',
  -- customer + address snapshot
  customer_name     text not null check (char_length(customer_name) between 2 and 120),
  email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone             text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),   -- E.164
  country           char(2) not null check (country ~ '^[A-Z]{2}$'),
  address_line1     text not null check (char_length(address_line1) between 3 and 200),
  address_line2     text check (char_length(address_line2) <= 200),
  city              text not null check (char_length(city) between 2 and 80),
  region            text check (char_length(region) <= 80),
  postal_code       text check (char_length(postal_code) <= 20),
  notes             text check (char_length(notes) <= 500),
  -- money (BDT, integer taka)
  shipping_zone_id  text not null references public.shipping_zones (id),
  subtotal_bdt      int not null check (subtotal_bdt >= 0),
  discount_bdt      int not null default 0 check (discount_bdt >= 0 and discount_bdt <= subtotal_bdt),
  shipping_bdt      int not null default 0 check (shipping_bdt >= 0),
  total_bdt         int not null,
  coupon_code       text,
  -- fulfilment
  courier           text,
  tracking_number   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (total_bdt = subtotal_bdt - discount_bdt + shipping_bdt),
  check (payment_method <> 'cod' or country = 'BD')
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx  on public.orders (status, created_at desc);
create index orders_phone_idx   on public.orders (phone);

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  variant_id      uuid references public.product_variants (id) on delete set null,
  product_name    text not null,
  colour          text not null,
  size            text not null,
  sku             text not null,
  unit_price_bdt  int not null check (unit_price_bdt > 0),
  quantity        int not null check (quantity between 1 and 10),
  line_total_bdt  int not null,
  created_at      timestamptz not null default now(),
  check (line_total_bdt = unit_price_bdt * quantity)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  provider      public.payment_method not null,
  status        public.payment_status not null default 'pending',
  amount_bdt    int not null check (amount_bdt >= 0),
  currency      char(3) not null default 'BDT',
  provider_ref  text,                                 -- e.g. Stripe Checkout Session id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index payments_order_idx on public.payments (order_id);

-- Webhook de-duplication: every provider event is processed at most once.
create table public.payment_events (
  provider     public.payment_method not null,
  event_id     text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  primary key (provider, event_id)
);

create table public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now()
);

-- ───────────── updated_at triggers ─────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','categories','products','product_images','product_variants','inventory',
                           'shipping_zones','coupons','orders','payments'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
