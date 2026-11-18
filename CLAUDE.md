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
- [ ] Phase 3: shop (search/filters/sort/pagination), product detail, cart drawer + page, wishlist
- [ ] Phase 4: Supabase schema + RLS + seed, auth, accounts, products from DB, `newsletter_subscribers`
- [ ] Phase 5: checkout, orders, payment adapters (COD, bKash, Nagad, Stripe), shipping adapters (Pathao, Steadfast, manual), tracking
- [ ] Phase 6: admin dashboard
- [ ] Phase 7: tests (unit + Playwright), authz tests
- [ ] Phase 8: Vercel + Supabase production deploy, docs
- [ ] i18n (EN/BN) and BDT/USD display with configured rates
