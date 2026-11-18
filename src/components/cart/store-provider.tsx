"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { priceOf, type Product } from "@/lib/catalog";

export type CartLine = { productId: string; size: string; qty: number };
export type ResolvedLine = CartLine & { product: Product; unitPrice: number; lineTotal: number; available: number };
type AppliedCoupon = { code: string; discountBDT: number; label: string };

type StoreCtx = {
  hydrated: boolean;
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  add: (productId: string, size: string, qty?: number) => { ok: boolean; message?: string };
  setQty: (productId: string, size: string, qty: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  coupon: AppliedCoupon | null;
  setCoupon: (c: AppliedCoupon | null) => void;
  wishlist: string[];
  getProduct: (id: string) => Product | undefined;
  toggleWish: (productId: string) => void;
  isWished: (productId: string) => boolean;
};

const Ctx = createContext<StoreCtx | null>(null);
const CART_KEY = "demo.cart.v1";
const WISH_KEY = "demo.wishlist.v1";
const MAX_PER_LINE = 10;

// Storage can throw (private mode, quota, sandboxed frames) — never let it break the UI.
function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Drop unknown products / sizes and clamp quantities to stock. */
function sanitize(raw: unknown, getProductById: (id: string) => Product | undefined): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { productId, size, qty } = r as Record<string, unknown>;
    if (typeof productId !== "string" || typeof size !== "string" || typeof qty !== "number") continue;
    const p = getProductById(productId);
    const stock = p?.stock[size] ?? 0;
    if (!p || stock <= 0) continue;
    out.push({ productId, size, qty: Math.max(1, Math.min(Math.floor(qty), stock, MAX_PER_LINE)) });
  }
  return out;
}

export function StoreProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const getProductById = useCallback((id: string) => byId.get(id), [byId]);
  const [hydrated, setHydrated] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    setCart(sanitize(load(CART_KEY, []), getProductById));
    setWishlist(load<string[]>(WISH_KEY, []).filter((id) => typeof id === "string" && getProductById(id)));
    setHydrated(true);
  }, [getProductById]);
  useEffect(() => { if (hydrated) save(CART_KEY, cart); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) save(WISH_KEY, wishlist); }, [wishlist, hydrated]);
  // Any cart change invalidates a previously validated discount amount.
  useEffect(() => setCoupon(null), [cart]);

  const add = useCallback<StoreCtx["add"]>((productId, size, qty = 1) => {
    const p = getProductById(productId);
    const stock = p?.stock[size] ?? 0;
    if (!p || stock <= 0) return { ok: false, message: "This size is sold out." };
    const limit = Math.min(stock, MAX_PER_LINE);
    const existing = cartRef.current.find((l) => l.productId === productId && l.size === size);
    if (existing && existing.qty >= limit) return { ok: false, message: `Only ${limit} available in this size.` };
    const nextQty = Math.min((existing?.qty ?? 0) + qty, limit);
    const next = existing
      ? cartRef.current.map((l) => (l === existing ? { ...l, qty: nextQty } : l))
      : [...cartRef.current, { productId, size, qty: nextQty }];
    cartRef.current = next;
    setCart(next);
    const result = { ok: true };
    return result;
  }, [getProductById]);

  const setQty = useCallback((productId: string, size: string, qty: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId || l.size !== size) return l;
        const stock = getProductById(productId)?.stock[size] ?? 0;
        return { ...l, qty: Math.max(1, Math.min(qty, stock, MAX_PER_LINE)) };
      }),
    );
  }, [getProductById]);

  const remove = useCallback((productId: string, size: string) => {
    setCart((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)));
  }, []);

  const toggleWish = useCallback((id: string) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const value = useMemo<StoreCtx>(() => {
    const lines: ResolvedLine[] = cart.flatMap((l) => {
      const product = getProductById(l.productId);
      if (!product) return [];
      const unitPrice = priceOf(product);
      return [{ ...l, product, unitPrice, lineTotal: unitPrice * l.qty, available: Math.min(product.stock[l.size] ?? 0, MAX_PER_LINE) }];
    });
    return {
      hydrated,
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      subtotal: lines.reduce((a, l) => a + l.lineTotal, 0),
      add,
      setQty,
      remove,
      clear: () => setCart([]),
      drawerOpen,
      openDrawer,
      closeDrawer,
      coupon,
      setCoupon,
      wishlist,
      getProduct: getProductById,
      toggleWish,
      isWished: (id) => wishlist.includes(id),
    };
  }, [cart, hydrated, add, setQty, remove, drawerOpen, openDrawer, closeDrawer, coupon, wishlist, toggleWish, getProductById]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
