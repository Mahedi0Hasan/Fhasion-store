-- Optional Bangla content for products and categories.
-- Empty values fall back to English on the storefront.
alter table public.products
  add column if not exists name_bn        text check (char_length(name_bn) <= 160),
  add column if not exists colour_bn      text check (char_length(colour_bn) <= 60),
  add column if not exists description_bn text check (char_length(description_bn) <= 3000),
  add column if not exists details_bn     text[] not null default '{}';

alter table public.categories
  add column if not exists name_bn text check (char_length(name_bn) <= 80);
