# DEMO: premium fashion storefront

A minimalist, editorial fashion e-commerce site for Bangladesh and international customers.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional for now
npm run dev                  # http://localhost:3000
```

Checks: `npx tsc --noEmit` · `npx eslint src` · `npm run build`

## What's built (Phases 1–2)

- Design tokens (cream / ivory / sand / charcoal), self-hosted Cormorant Garamond + Inter
- Rotating announcement bar, sticky header with blur-on-scroll, animated mobile menu, footer
- **Hero slider**: giant serif word with letter reveal, floating product cutouts with pointer-driven 3D tilt and parallax, pedestal and drifting mist, swatch selector, product card, faded neighbour previews, autoplay with pause on hover/focus, keyboard and screen-reader support, reduced-motion fallback
- Homepage: featured collections (arched frames), new arrivals, parallax promo banner, best sellers, brand story, lookbook, newsletter
- `/api/newsletter`: Zod validation + rate limit; returns an honest 503 until Supabase is configured

## Phase 3 (done)

- `/shop`: search, category / size / colour / price filters, 5 sort orders, pagination, empty state, mobile filter sheet. All state lives in the URL, so it can be shared
- `/product/[slug]`: image gallery with hover zoom, size selector with per-size stock and sold-out states, quantity, add to bag, wishlist, related products, Product JSON-LD, Open Graph
- Cart drawer + `/cart`: quantity capped at stock, remove, coupon codes validated server-side (demo codes `WELCOME10`, `DEMO500`), shipping estimate by zone
- `/wishlist`: saved on the device

## Phases 4–5 (done): database, checkout, orders

No customer accounts: shoppers check out as guests and track orders with order number + phone.

- **Database** (`supabase/migrations`): normalized tables with UUID keys, foreign keys, constraints, indexes and `updated_at` triggers. Row Level Security on every table. The public can read only the active catalogue; orders, payments, coupons and subscribers are staff-only.
- **Orders**: one SQL function, `place_order`, re-prices everything from the database, checks stock with row locks, applies coupons, computes delivery, writes the order + items + payment, and decrements stock in a single transaction. It is idempotent, so a double-click never creates two orders. Only the server can call it.
- **Payments**
  - Cash on delivery (Bangladesh only): live.
  - Card via Stripe Checkout: charged in **BDT**, the exact order total. Orders are marked paid only by the signature-verified webhook, and only if the amount matches. Needs a Stripe account (Stripe doesn't onboard Bangladesh-registered businesses directly).
  - bKash and Nagad: shown as "Not available yet" until merchant credentials exist and the integration is verified in their sandbox.
- **Tracking**: `/track-order` needs both the order number and the checkout phone, and shows no address or email.
- **Couriers**: manual tracking numbers now. Pathao and Steadfast adapters are disabled until verified.

## Connect Supabase (when you're ready)

1. Create a project at supabase.com → **Project Settings → API**. Copy the URL, `anon` key and `service_role` key.
2. **SQL Editor**: run every file in `supabase/migrations/` in order, then `supabase/seed.sql`.
3. Create `.env.local` (and the same variables on Vercel):
   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, never expose
   ORDER_TOKEN_SECRET=...               # openssl rand -base64 48
   ```
4. **First admin**: Authentication → Users → *Add user* (email + password, auto-confirm). Then, in the SQL Editor:
   `update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');`
   Sign in at `/admin`. Use `role = 'staff'` for team members. Staff can't change delivery fees or see Settings.
   Also turn **off** "Allow new users to sign up" under Authentication → Providers → Email, because the store has no customer accounts.
5. **Database → Extensions**: enable `pg_cron`, then run:
   `select cron.schedule('release-unpaid', '*/10 * * * *', 'select public.release_unpaid_orders()');`
6. Optional, for card payments: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and point a Stripe webhook at `/api/webhooks/stripe`.

Until step 3 is done, the site still works for browsing. Checkout shows a clear "being connected" notice and accepts no orders.

## Testing

- `npm run typecheck`, `npm run lint`, `npm run build`
- `npm run test:db`: 19 database tests (see `CLAUDE.md`)

## Phase 6 (done): admin dashboard (`/admin`)

- **Sign-in**: Supabase Auth with email and password, rate-limited. Only users whose profile has a `staff` or `admin` role get in. Access is checked three times: the middleware, the server page, and the database's RLS, because every dashboard query runs as the signed-in user.
- **Overview**: revenue, orders, customers, products, a 30-day sales chart, low-stock alerts, recent orders, and top products.
- **Orders**: search, status filter, and an order page with status changes (confirm → packing → shipped with courier + tracking → delivered; cancel puts stock back; refund). Cash on delivery is marked paid on delivery.
- **Products**: create and edit, sizes with SKU and stock, and photos (uploaded to the Supabase Storage bucket `product-images`, created by the migration; files are checked by content, not by name). Changes show in the store immediately.
- **Also**: inventory, categories, coupons, customers (grouped by phone, since there are no accounts), sales reports (7 / 30 / 90 / 365 days), and settings for delivery fees (admins only).

## Languages: English + বাংলা

- A switch in the header (English ⇄ বাংলা) remembers the choice. Visitors whose browser prefers Bangla see Bangla first.
- The whole storefront is translated: menus, product pages, cart, checkout (including error messages), order confirmation and tracking. Prices and counts use Bengali digits (৳ ১৪,৫০০).
- Products can carry a Bangla name, colour, description and details. Fill them in on the product page in the dashboard. Anything left blank shows in English.
- Search works in both languages ("কার্ডিগান" and "cardigan" find the same product).
- The admin dashboard stays in English.

## Not yet built

- Info pages: About, Contact, FAQ, Privacy, Terms, Shipping and Returns policies. Footer links to these 404 for now.
- A BDT/USD price switcher on the storefront
- bKash and Nagad: need merchant accounts and sandbox verification
- Pathao and Steadfast booking from the dashboard: needs courier API keys and verification
- Phase 8: Vercel deployment

## Images: action needed before launch

Every image in `public/images` is a placeholder supplied during design. Several appear to be third-party editorial or brand photography. **Replace them with your own or properly licensed photos before going live.**
