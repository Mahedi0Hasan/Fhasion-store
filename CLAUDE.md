# DEMO — working notes for Claude

Premium minimalist fashion e-commerce (Bangladesh + international). Read this before changing anything.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (tokens in `src/app/globals.css` `@theme`) · Framer Motion 11 · Zod · Lucide. Supabase, React Hook Form, payments and shipping arrive in later phases.

## Design language (from the user's reference images)
- Warm cream/ivory/sand backgrounds, charcoal ink, camel/clay accents. No loud colour, no heavy gradients.
- Cormorant Garamond for display (oversized, tight leading); Inter for UI. Fonts are self-hosted via `@fontsource` (Google Fonts is unreachable from the build sandbox).
- Hero: giant serif word behind a floating product cutout, pedestal + mist, swatch selector, side product card, faded neighbour products at the edges.
- Arched (`rounded-t-full`) image frames, generous whitespace, `label` utility for eyebrow text.

## Motion rules
- Animate opacity/transform only. Ease `[0.22, 1, 0.36, 1]` (`--ease-soft`).
- Always honour `useReducedMotion()`; the global CSS also kills animations under `prefers-reduced-motion`.
- Use `Reveal` / `RevealWords` (`src/components/animations/reveal.tsx`) for scroll reveals.
- No Three.js unless real interaction needs it; the hero gets its 3D feel from pointer tilt + parallax on photo cutouts.

## Images
- `public/images/products/*.webp`: background-removed cutouts (rembg, isnet-general-use), edge-eroded.
- `public/images/editorial/*.webp`: editorial photos.
- All are **user-supplied placeholders**. Replace them with owned or licensed photography before launch.

## Rules
- Never fake success: forms must hit a real endpoint and report real failures (see `/api/newsletter`).
- Validate on the server with Zod. Secrets are server-only; never commit `.env*` (except `.env.example`).
- Don't claim a feature works until `npx tsc --noEmit`, `npx eslint src` and `npm run build` pass and the route has been looked at.

## Phase checklist
- [x] Phase 1: scaffold, tokens, fonts, layout (announcement bar, header, mobile menu, footer), docs
- [x] Phase 2: homepage (hero slider, collections, new arrivals, promo, best sellers, story, lookbook, newsletter), product card, reveal system
- [x] Phase 3: shop (search/filters/sort/pagination, URL-driven), product detail (gallery zoom, sizes, stock, qty, JSON-LD), cart drawer + page, server-validated coupons (`/api/coupon`), shipping estimate, wishlist. Cart/wishlist live in localStorage until Phase 4. Checkout button is intentionally disabled until Phase 5.
- [x] Phase 4: Supabase schema + RLS + seed (generated from `src/lib/catalog.ts` via `npm run seed:generate`), `newsletter_subscribers`. Products are still read from `catalog.ts`; switch reads to the DB together with admin product management (Phase 6). **No customer login/accounts (user decision, 2026-11-18)**: guest checkout only; order tracking by order number + phone at `/track-order`. Auth exists only for admins.
- [x] Phase 5: guest checkout (`/checkout`), atomic `place_order` SQL function, signed confirmation (`/order/[number]?t=`), `/track-order`, payment adapters (COD live; Stripe Checkout in BDT + verified webhook; bKash/Nagad registered but unavailable until merchant sandbox is verified), courier adapters (manual live; Pathao/Steadfast disabled until verified).
- [ ] Schedule `select public.release_unpaid_orders();` every 10 min with pg_cron in production.
- [x] Phase 6: admin dashboard at `/admin` (Supabase Auth email+password via `@supabase/ssr`; middleware gate + server `requireStaff/requireAdmin` + RLS). Overview KPIs & 30-day chart, low stock, orders (search/filter/detail, `staff_update_order` with transition rules + restock on cancel, COD paid on delivery), products (CRUD, sizes/SKU/stock, photo upload to Storage bucket `product-images` with magic-byte checks), inventory, categories, coupons, customers (grouped by phone), reports, settings (delivery fees; admin-only). Storefront now reads products from the DB (`src/lib/catalog-source.ts`, tag `catalog`), falling back to `DEMO_PRODUCTS`.
- [ ] Phase 7: tests (unit + Playwright), authz tests
- [ ] Phase 8: Vercel + Supabase production deploy, docs
- [x] Bilingual storefront (English + বাংলা), 2026-11-19:
  - UI strings in `src/lib/i18n/dictionaries/{en,bn}.ts` (bn is type-checked against en). Server: `getI18n()`; client: `useI18n()` (`t`, `tm` for "err.*" keys, `money`, `num`).
  - Locale = `lang` cookie (EN ⇄ বাংলা switch in header), else Accept-Language (bn → Bangla), else English. One URL per page (no /bn prefix).
  - Product/category Bangla content: `name_bn`, `colour_bn`, `description_bn`, `details_bn`, `categories.name_bn` (migration 0005), editable in admin; blank falls back to English. Filter/URL keys stay English so links work in both languages; search matches both.
  - Bengali digits for prices/counts (`bn-BD`). Fonts: Noto Serif Bengali + Hind Siliguri as per-glyph fallbacks. `:lang(bn)` CSS adds line-height and removes tracking; Latin wordmarks use `lang="en"`.
  - Never split Bengali text into letters for animation (breaks conjuncts). Hero animates the whole word in Bangla.
  - Validation messages are dictionary keys (`err.*`); API routes answer in the shopper's language.
- [ ] USD price toggle on the storefront (checkout already shows a USD reference when `BDT_PER_USD` is set)

## Testing
- `npm run test:db`: 22 SQL tests (RLS, pricing, coupons, stock, concurrency, webhooks, tracking) against a throwaway Postgres with `supabase/tests/00_supabase_shim.sql`. Env: `TEST_PG_HOST`, `TEST_PG_PORT`.
- The end-to-end browser suite was run against Postgres + PostgREST locally (24 checks, all passing on 2026-11-19). Admin flow tested against real Supabase Auth (GoTrue v2.177) + PostgREST: 30 checks passing. Bangla flow: 27 checks passing (2026-11-19).
