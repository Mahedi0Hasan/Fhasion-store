import Link from "next/link";
import { formatBDT } from "@/lib/catalog";

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl leading-none text-ink md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-stone">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[3px] border border-line bg-ivory p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-medium text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[3px] border border-line bg-ivory p-5">
      <p className="text-xs text-stone">{label}</p>
      <p className="mt-2 font-serif text-4xl leading-none text-ink">{value}</p>
      {hint && <p className="mt-2 text-xs text-stone">{hint}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-sky-100 text-sky-900",
  processing: "bg-indigo-100 text-indigo-900",
  shipped: "bg-violet-100 text-violet-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-700",
  refunded: "bg-rose-100 text-rose-900",
  paid: "bg-emerald-100 text-emerald-900",
  failed: "bg-rose-100 text-rose-900",
};
export function Badge({ value }: { value: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium capitalize ${STATUS_STYLE[value] ?? "bg-sand text-ink"}`}>{value}</span>;
}

export const th = "px-3 py-2.5 text-left text-[0.7rem] font-medium uppercase tracking-wider text-stone";
export const td = "px-3 py-3 text-sm text-ink";
export const field = "h-10 w-full rounded-[2px] border border-ink/15 bg-cream/40 px-3 text-sm focus:border-ink focus:outline-none";
export const btn = "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-ivory transition-opacity hover:opacity-90 disabled:opacity-50";
export const btnGhost = "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:border-ink disabled:opacity-50";

export const money = formatBDT;
export const when = (d: string) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-end gap-2 text-sm">
      {page > 1 && <Link className={btnGhost} href={href(page - 1)}>Previous</Link>}
      <span className="px-2 text-stone">Page {page} of {pages}</span>
      {page < pages && <Link className={btnGhost} href={href(page + 1)}>Next</Link>}
    </nav>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-stone">{children}</p>;
}

/** Inline result of a server action. */
export function ActionMsg({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error) return <p role="alert" className="text-sm text-clay">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-emerald-800">{state.ok}</p>;
  return null;
}
