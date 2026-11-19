"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { COUNTRIES } from "@/lib/countries";
import { trackOrder, type TrackState } from "./actions";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const input = "h-12 w-full rounded-[2px] border border-ink/15 bg-ivory/60 px-4 text-sm focus:border-ink focus:outline-none";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, {});
  const { t, bdt: formatBDT, locale, dict } = useI18n();
  const LABEL = (s: string) => t(`track.status.${s}`);
  const note = (n: string) => dict.track.notes[n] ?? n; // keys are full sentences, so no dotted lookup
  const dateLocale = locale === "bn" ? "bn-BD" : "en-GB";
  // Controlled so values survive React 19's automatic form reset after an action.
  const [num, setNum] = useState("");
  const [country, setCountry] = useState("BD");
  const [phone, setPhone] = useState("");
  const o = state.order;
  const stepIdx = o ? STEPS.indexOf(o.status as (typeof STEPS)[number]) : -1;

  return (
    <>
      <form action={action} className="mt-10 grid gap-4 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs text-stone">{t("track.number")}</span>
          <input name="order_number" value={num} onChange={(e) => setNum(e.target.value)} required placeholder="DM-261118-A1B2C3" autoCapitalize="characters" className={`${input} uppercase placeholder:normal-case`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-stone">{t("track.country")}</span>
          <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={input}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-stone">{t("track.phone")}</span>
          <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required autoComplete="tel" placeholder="01712 345678" className={input} />
        </label>
        <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-ivory disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />} {t("track.submit")}
        </button>
      </form>
      {state.error && <p role="alert" className="mt-4 text-sm text-clay">{state.error}</p>}

      {o && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-12 rounded-[2px] bg-ivory p-6 md:p-8" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-serif text-3xl text-ink">{o.order_number}</p>
            <p className="text-sm text-stone">{new Date(o.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })} · {formatBDT(o.total_bdt)}</p>
          </div>

          {stepIdx >= 0 ? (
            <ol className="mt-8 grid grid-cols-5 gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className="text-center">
                  <div className={`h-1 rounded-full ${i <= stepIdx ? "bg-ink" : "bg-ink/10"}`} />
                  <p className={`mt-2 text-[0.7rem] ${i <= stepIdx ? "text-ink" : "text-stone/60"}`}>{LABEL(s)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 inline-block rounded-full bg-clay/15 px-3 py-1 text-sm text-clay">{LABEL(o.status)}</p>
          )}

          {o.tracking_number && <p className="mt-6 text-sm text-ink">{t("track.courier", { c: o.courier ?? "—", n: o.tracking_number })}</p>}

          <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
            {o.items.map((it, i) => <li key={i} className="py-2.5 text-ink">{it.name} <span className="text-stone">· {it.size} × {it.qty}</span></li>)}
          </ul>
          <ol className="mt-6 space-y-3 text-sm">
            {[...o.events].reverse().map((e, i) => (
              <li key={i} className="flex gap-4">
                <span className="w-32 shrink-0 text-xs text-stone">{new Date(e.at).toLocaleString(dateLocale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-ink">{LABEL(e.status)}{e.note ? <span className="text-stone">: {note(e.note)}</span> : null}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}
    </>
  );
}
