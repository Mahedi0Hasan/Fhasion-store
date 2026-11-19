-- Messages sent from the storefront Contact page.
-- Inserted only by the server (service role) after validation + rate limiting;
-- readable and updatable by staff only.
create table public.contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone         text check (char_length(phone) <= 24),
  topic         text not null check (topic in ('order', 'sizing', 'returns', 'wholesale', 'other')),
  order_number  text check (order_number ~ '^DM-\d{6}-[0-9A-F]{6}$'),
  message       text not null check (char_length(message) between 10 and 2000),
  locale        text not null default 'en' check (locale in ('en', 'bn')),
  status        text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create trigger set_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;
create policy contact_messages_staff_read   on public.contact_messages for select to authenticated using (public.is_staff());
create policy contact_messages_staff_update on public.contact_messages for update to authenticated using (public.is_staff()) with check (public.is_staff());
-- No insert/delete policies: anon and customers can't write here directly.
