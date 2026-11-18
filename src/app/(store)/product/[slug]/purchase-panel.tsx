"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Truck, RotateCcw } from "lucide-react";
import { formatBDT, type Product } from "@/lib/catalog";
import { useStore } from "@/components/cart/store-provider";
import { QtyStepper } from "@/components/cart/cart-parts";
import { WishButton } from "@/components/products/wish-button";

export function PurchasePanel({ product }: { product: Product }) {
  const { add, openDrawer } = useStore();
  const sizes = Object.keys(product.stock);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  const stock = size ? product.stock[size] ?? 0 : 0;
  const maxQty = Math.max(1, Math.min(stock, 10));
  const onSale = product.salePriceBDT !== undefined && product.salePriceBDT < product.priceBDT;
  const allSoldOut = sizes.every((s) => product.stock[s] === 0);

  function onAdd() {
    if (!size) {
      setMsg({ tone: "error", text: "Please choose a size." });
      return;
    }
    const r = add(product.id, size, qty);
    if (!r.ok) {
      setMsg({ tone: "error", text: r.message ?? "Couldn't add to bag." });
      return;
    }
    setMsg({ tone: "ok", text: "Added to your bag." });
    setQty(1);
    openDrawer();
  }

  return (
    <div>
      <p className="label text-stone">{product.colour}</p>
      <h1 className="mt-3 font-serif text-4xl leading-[1] text-ink md:text-6xl">{product.name}</h1>
      <div className="mt-5 flex items-baseline gap-3">
        {onSale ? (
          <>
            <span className="font-serif text-3xl text-clay">{formatBDT(product.salePriceBDT!)}</span>
            <span className="text-sm text-stone line-through">{formatBDT(product.priceBDT)}</span>
            <span className="rounded-full bg-clay px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-ivory">
              {Math.round((1 - product.salePriceBDT! / product.priceBDT) * 100)}% off
            </span>
          </>
        ) : (
          <span className="font-serif text-3xl text-ink">{formatBDT(product.priceBDT)}</span>
        )}
      </div>
      <p className="mt-6 leading-relaxed text-stone">{product.description}</p>

      {/* Colour (single colourway per product in the demo catalogue) */}
      <div className="mt-8 flex items-center gap-3">
        <span className="size-7 rounded-full ring-1 ring-black/10 ring-offset-2 ring-offset-cream" style={{ background: product.colourHex }} aria-hidden="true" />
        <span className="text-sm text-ink">Colour: {product.colour}</span>
      </div>

      {/* Size */}
      <fieldset className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <legend className="label text-stone">Size</legend>
          {size && (
            <span className={`text-xs ${stock <= 3 ? "text-clay" : "text-stone"}`} aria-live="polite">
              {stock <= 3 ? `Only ${stock} left` : "In stock"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const out = product.stock[s] === 0;
            const on = size === s;
            return (
              <button
                key={s}
                type="button"
                disabled={out}
                aria-pressed={on}
                aria-label={out ? `${s}, sold out` : s}
                onClick={() => {
                  setSize(s);
                  setQty(1);
                  setMsg(null);
                }}
                className={`relative h-11 min-w-14 rounded-full border px-4 text-sm transition-colors ${
                  on ? "border-ink bg-ink text-ivory" : out ? "cursor-not-allowed border-ink/10 text-stone/50 line-through" : "border-ink/20 hover:border-ink"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Qty + actions */}
      <div className="mt-8 flex items-center gap-3">
        <QtyStepper value={qty} max={size ? maxQty : 1} onChange={setQty} label="Quantity" />
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onAdd}
          disabled={allSoldOut}
          className="group relative h-12 flex-1 overflow-hidden rounded-full bg-ink text-sm font-medium text-ivory disabled:opacity-40"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-clay transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-x-100" />
          <span className="relative inline-flex items-center gap-2">
            {allSoldOut ? "Sold out" : <><Plus className="size-4" /> Add to bag</>}
          </span>
        </motion.button>
        <WishButton productId={product.id} name={product.name} className="grid size-12 shrink-0 place-items-center rounded-full border border-ink/20 text-ink transition-colors hover:border-ink" />
      </div>
      <div className="mt-3 min-h-5" aria-live="polite">
        <AnimatePresence mode="wait">
          {msg && (
            <motion.p key={msg.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-center gap-1.5 text-sm ${msg.tone === "error" ? "text-clay" : "text-ink"}`}>
              {msg.tone === "ok" && <Check className="size-4" />} {msg.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Details */}
      <div className="mt-8 divide-y divide-line border-y border-line">
        <details className="group py-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
            Details & care <Plus className="size-4 transition-transform group-open:rotate-45" />
          </summary>
          <ul className="mt-3 space-y-1.5 text-sm text-stone">
            {product.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </details>
        <details className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
            Delivery & returns <Plus className="size-4 transition-transform group-open:rotate-45" />
          </summary>
          <div className="mt-3 space-y-2 text-sm text-stone">
            <p className="flex gap-2"><Truck className="mt-0.5 size-4 shrink-0" /> Inside Dhaka in 1–2 days, rest of Bangladesh in 2–4 days, worldwide in 7–14 days.</p>
            <p className="flex gap-2"><RotateCcw className="mt-0.5 size-4 shrink-0" /> Free 7-day returns on full-price pieces, unworn with tags.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
