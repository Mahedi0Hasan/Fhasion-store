"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { ALL_COLOURS, ALL_SIZES, CATEGORIES, PRICE_BOUNDS, SORTS, type ShopQuery } from "@/lib/catalog";

type Patch = Partial<Omit<ShopQuery, "page">>;

function toSearch(q: ShopQuery, patch: Patch) {
  const n = { ...q, ...patch };
  const sp = new URLSearchParams();
  if (n.q) sp.set("q", n.q);
  if (n.category) sp.set("category", n.category);
  if (n.sizes.length) sp.set("size", n.sizes.join(","));
  if (n.colours.length) sp.set("colour", n.colours.join(","));
  if (n.min !== undefined) sp.set("min", String(n.min));
  if (n.max !== undefined) sp.set("max", String(n.max));
  if (n.sort !== "featured") sp.set("sort", n.sort);
  return sp.toString(); // any filter change resets to page 1
}

export function ShopControls({ query, total, children }: { query: ShopQuery; total: number; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState(false);
  const [term, setTerm] = useState(query.q ?? "");

  useEffect(() => setTerm(query.q ?? ""), [query.q]);
  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet]);

  const update = (patch: Patch) => {
    const s = toSearch(query, patch);
    start(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };

  const activeCount = (query.category ? 1 : 0) + query.sizes.length + query.colours.length + (query.min !== undefined || query.max !== undefined ? 1 : 0);
  const panel = <FilterPanel query={query} update={update} />;

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-5 mt-8 flex flex-wrap items-center gap-3 border-y border-line bg-cream/90 px-5 py-3 backdrop-blur md:top-[4.25rem] md:mx-0 md:px-0">
        <form
          id="search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: term.trim() || undefined });
          }}
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-ink/15 px-4 focus-within:border-ink md:max-w-xs"
        >
          <Search className="size-4 shrink-0 text-stone" />
          <label htmlFor="shop-q" className="sr-only">Search products</label>
          <input id="shop-q" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search pieces" className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-stone/70 focus:outline-none" />
        </form>
        <button type="button" onClick={() => setSheet(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm lg:hidden">
          <SlidersHorizontal className="size-4" /> Filters{activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] text-ivory">{activeCount}</span>}
        </button>
        <p className="hidden text-sm text-stone md:block" aria-live="polite">{pending ? "Updating…" : `${total} ${total === 1 ? "piece" : "pieces"}`}</p>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="hidden text-sm text-stone sm:block">Sort</label>
          <select id="sort" value={query.sort} onChange={(e) => update({ sort: e.target.value as ShopQuery["sort"] })} className="h-10 rounded-full border border-ink/15 bg-transparent pl-4 pr-8 text-sm focus:border-ink focus:outline-none">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside aria-label="Filters" className="hidden lg:block">{panel}</aside>
        <div className={`transition-opacity duration-300 ${pending ? "opacity-50" : ""}`}>{children}</div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-ink/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-3xl bg-ivory lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <p className="font-serif text-2xl">Filters</p>
                <button type="button" aria-label="Close filters" onClick={() => setSheet(false)} className="grid size-10 place-items-center"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">{panel}</div>
              <div className="border-t border-line p-4">
                <button type="button" onClick={() => setSheet(false)} className="h-12 w-full rounded-full bg-ink text-sm font-medium text-ivory">Show {total} {total === 1 ? "piece" : "pieces"}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterPanel({ query, update }: { query: ShopQuery; update: (p: Patch) => void }) {
  const [min, setMin] = useState(query.min?.toString() ?? "");
  const [max, setMax] = useState(query.max?.toString() ?? "");
  useEffect(() => { setMin(query.min?.toString() ?? ""); setMax(query.max?.toString() ?? ""); }, [query.min, query.max]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const hasAny = query.category || query.sizes.length || query.colours.length || query.min !== undefined || query.max !== undefined;

  return (
    <div className="space-y-9">
      {hasAny && (
        <button type="button" onClick={() => update({ category: undefined, sizes: [], colours: [], min: undefined, max: undefined })} className="text-xs font-medium underline underline-offset-4">
          Clear all filters
        </button>
      )}
      <Group title="Category">
        <ul className="space-y-1.5">
          <li><CatButton active={!query.category} onClick={() => update({ category: undefined })}>All</CatButton></li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}><CatButton active={query.category === c.slug} onClick={() => update({ category: c.slug })}>{c.name}</CatButton></li>
          ))}
        </ul>
      </Group>
      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => {
            const on = query.sizes.includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => update({ sizes: toggle(query.sizes, s) })} className={`h-9 min-w-11 rounded-full border px-3 text-xs transition-colors ${on ? "border-ink bg-ink text-ivory" : "border-ink/15 hover:border-ink"}`}>
                {s}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {ALL_COLOURS.map((c) => {
            const on = query.colours.includes(c.name);
            return (
              <button key={c.name} type="button" aria-pressed={on} aria-label={c.name} title={c.name} onClick={() => update({ colours: toggle(query.colours, c.name) })} className={`relative grid size-9 place-items-center rounded-full ring-1 ring-offset-2 ring-offset-cream transition ${on ? "ring-ink" : "ring-transparent hover:ring-ink/30"}`}>
                <span className="size-7 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                {on && <Check className="absolute size-3.5 text-ink mix-blend-difference" />}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Price (BDT)">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const lo = min === "" ? undefined : Math.max(0, Number(min));
            const hi = max === "" ? undefined : Math.max(0, Number(max));
            update({ min: Number.isFinite(lo) ? lo : undefined, max: Number.isFinite(hi) ? hi : undefined });
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="pmin" className="sr-only">Minimum price</label>
          <input id="pmin" inputMode="numeric" placeholder={String(PRICE_BOUNDS.min)} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className="h-9 w-full rounded-full border border-ink/15 bg-transparent px-3 text-xs focus:border-ink focus:outline-none" />
          <span className="text-stone">–</span>
          <label htmlFor="pmax" className="sr-only">Maximum price</label>
          <input id="pmax" inputMode="numeric" placeholder={String(PRICE_BOUNDS.max)} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className="h-9 w-full rounded-full border border-ink/15 bg-transparent px-3 text-xs focus:border-ink focus:outline-none" />
          <button type="submit" className="h-9 shrink-0 rounded-full bg-ink px-3 text-xs text-ivory">Go</button>
        </form>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="label mb-4 text-stone">{title}</legend>
      {children}
    </fieldset>
  );
}

function CatButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`text-left text-sm transition-colors ${active ? "font-medium text-ink" : "text-stone hover:text-ink"}`}>
      {active && <span className="mr-2 inline-block size-1.5 rounded-full bg-ink align-middle" />}
      {children}
    </button>
  );
}
