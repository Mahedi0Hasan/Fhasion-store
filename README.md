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

## Not yet built

Accounts, checkout, payments, shipping, admin. Links to those routes 404 for now. See the checklist in `CLAUDE.md`.

## Images: action needed before launch

Every image in `public/images` is a placeholder supplied during design. Several appear to be third-party editorial or brand photography. **Replace them with your own or properly licensed photos before going live.**
