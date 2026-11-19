"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { CouponForm } from "@/components/cart/cart-parts";
import { COUNTRIES } from "@/lib/countries";
import { feeFor } from "@/lib/shipping/zones";
import { useI18n } from "@/lib/i18n/client";
import { checkoutSchema, zoneFor, type CheckoutInput } from "@/lib/validation/checkout";
import type { PaymentOption } from "@/lib/payments";

export function CheckoutForm({ ready, payments }: { ready: boolean; payments: PaymentOption[] }) {
  const { lines, subtotal, coupon, hydrated, clear, zones } = useStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const { t, tm, bdt: formatBDT, num, locale, currency, bdtPerUsd } = useI18n();
  const zLabel = (id: string, fallback: string) => { const v = t(`zones.${id}.label`); return v.startsWith("zones.") ? fallback : v; };
  const countryName = (code: string, fallback: string) => {
    try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? fallback; } catch { return fallback; }
  };
  const eta = (e: string) => { const v = t(`zones.eta.${e}`); return v.startsWith("zones.") ? e : v; };
  const idem = useRef<string>("");
  if (!idem.current && typeof crypto !== "undefined") idem.current = crypto.randomUUID();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { country: "BD", delivery_area: "dhaka", payment_method: "cod" },
    mode: "onTouched",
  });

  const country = watch("country");
  const area = watch("delivery_area");
  const method = watch("payment_method");
  const isBD = country === "BD";

  // Keep payment + delivery choices valid when the country changes.
  useEffect(() => {
    const current = payments.find((p) => p.id === method);
    const ok = current && current.available && (current.countries === "all" || isBD);
    if (!ok) {
      const first = payments.find((p) => p.available && (p.countries === "all" || isBD));
      if (first) setValue("payment_method", first.id);
    }
    if (isBD && !area) setValue("delivery_area", "dhaka");
  }, [country, isBD, area, method, payments, setValue]);

  useEffect(() => setValue("coupon_code", coupon?.code ?? ""), [coupon, setValue]);

  const zoneId = zoneFor(country, area);
  const zone = zones.find((z) => z.id === zoneId) ?? zones[0];
  const discount = coupon?.discountBDT ?? 0;
  const shipping = feeFor(zone, subtotal - discount);
  const total = subtotal - discount + shipping;

  async function onSubmit(values: CheckoutInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotency_key: idem.current,
          form: values,
          lines: lines.map(({ productId, size, qty }) => ({ productId, size, qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field) setError(data.field as FieldPath<CheckoutInput>, { message: data.error });
        setServerError(data.error ?? t("checkout.generic"));
        // A rejected order never existed — allow a fresh attempt.
        if (res.status !== 429 && res.status < 500) idem.current = crypto.randomUUID();
        return;
      }
      clear();
      window.location.assign(data.next);
    } catch {
      setServerError(t("checkout.network"));
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-start gap-5">
        <p className="text-stone">{t("cart.emptyShort")}</p>
        <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">{t("cart.continue")}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 grid gap-12 md:grid-cols-12">
      <div className="space-y-12 md:col-span-7">
        <Section n={num(1).padStart(2, num(0))} title={t("checkout.contact")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("checkout.name")} error={tm(errors.name?.message)} className="sm:col-span-2">
              <input {...register("name")} autoComplete="name" className={input} />
            </Field>
            <Field label={t("checkout.email")} error={tm(errors.email?.message)}>
              <input {...register("email")} type="email" autoComplete="email" inputMode="email" className={input} />
            </Field>
            <Field label={t("checkout.phone")} error={tm(errors.phone?.message)} hint={isBD ? t("checkout.phoneHintBD") : t("checkout.phoneHintIntl")}>
              <input {...register("phone")} type="tel" autoComplete="tel" inputMode="tel" className={input} />
            </Field>
          </div>
        </Section>

        <Section n={num(2).padStart(2, num(0))} title={t("checkout.delivery")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("checkout.country")} error={tm(errors.country?.message)} className="sm:col-span-2">
              <select {...register("country")} autoComplete="country" className={input}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code} suppressHydrationWarning>{countryName(c.code, c.name)}</option>)}
              </select>
            </Field>
            {isBD && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs text-stone">{t("checkout.area")}</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["dhaka", "outside-dhaka"] as const).map((id) => {
                    const z = zones.find((s) => s.id === id);
                    if (!z) return null;
                    return (
                      <label key={id} className={`${choice} ${area === id ? choiceOn : ""}`}>
                        <input type="radio" value={id} {...register("delivery_area")} className="sr-only" />
                        <span className="text-sm font-medium text-ink">{zLabel(z.id, z.label)}</span>
                        <span className="text-xs text-stone">{formatBDT(z.feeBDT)} · {eta(z.eta)}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.delivery_area && <p className={err}>{tm(errors.delivery_area.message)}</p>}
              </fieldset>
            )}
            <Field label={t("checkout.address")} error={tm(errors.address_line1?.message)} className="sm:col-span-2">
              <input {...register("address_line1")} autoComplete="address-line1" placeholder={t("checkout.addressPh")} className={input} />
            </Field>
            <Field label={t("checkout.apt")} className="sm:col-span-2">
              <input {...register("address_line2")} autoComplete="address-line2" className={input} />
            </Field>
            <Field label={isBD ? t("checkout.cityBD") : t("checkout.city")} error={tm(errors.city?.message)}>
              <input {...register("city")} autoComplete="address-level2" className={input} />
            </Field>
            <Field label={isBD ? t("checkout.districtOpt") : t("checkout.regionOpt")}>
              <input {...register("region")} autoComplete="address-level1" className={input} />
            </Field>
            <Field label={t("checkout.postalOpt")}>
              <input {...register("postal_code")} autoComplete="postal-code" className={input} />
            </Field>
            <Field label={t("checkout.notesOpt")} className="sm:col-span-2">
              <textarea {...register("notes")} rows={2} className={`${input} h-auto py-3`} />
            </Field>
          </div>
        </Section>

        <Section n={num(3).padStart(2, num(0))} title={t("checkout.payment")}>
          <div className="space-y-3">
            {payments
              .filter((p) => p.countries === "all" || isBD)
              .map((p) => {
                const disabled = !p.available;
                return (
                  <label key={p.id} className={`${choice} flex-row items-center justify-between ${method === p.id ? choiceOn : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" value={p.id} disabled={disabled} {...register("payment_method")} className="size-4 accent-[var(--color-ink)]" />
                      <span>
                        <span className="block text-sm font-medium text-ink">{t(`checkout.methods.${p.id}.label`)}</span>
                        <span className="block text-xs text-stone">{disabled ? t("checkout.notAvailable") : t(`checkout.methods.${p.id}.desc`)}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            {errors.payment_method && <p className={err}>{tm(errors.payment_method.message)}</p>}
            {!isBD && !payments.some((p) => p.available && p.countries === "all") && (
              <p className="rounded-[2px] bg-sand px-4 py-3 text-sm text-ink">
                {t("checkout.intlSoon", { contact: "\u0000" }).split("\u0000")[0]}<Link href="/contact" className="underline">{t("checkout.contactUs")}</Link>{t("checkout.intlSoon", { contact: "\u0000" }).split("\u0000")[1]}
              </p>
            )}
          </div>
        </Section>
      </div>

      {/* Summary */}
      <aside className="md:col-span-5 md:col-start-8">
        <div className="sticky top-24 rounded-[2px] bg-ivory p-6">
          <p className="mb-4 font-serif text-2xl">{t("checkout.yourOrder")}</p>
          <ul className="divide-y divide-line">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.size}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-13 shrink-0 bg-sand">
                  <Image src={l.product.images[0].src} alt="" fill sizes="52px" className={l.product.images[0].fit === "contain" ? "object-contain p-1" : "object-cover"} style={{ objectPosition: l.product.images[0].position }} />
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] text-ivory">{l.qty}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate text-ink">{l.product.name}</p>
                  <p className="text-xs text-stone">{t("cart.sizeColour", { colour: l.product.colour, size: l.size })}</p>
                </div>
                <p className="text-sm text-ink">{formatBDT(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4"><CouponForm /></div>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <Row k={t("cart.subtotal")} v={formatBDT(subtotal)} />
            {discount > 0 && <Row k={t("cart.discount", { code: coupon!.code })} v={`− ${formatBDT(discount)}`} accent />}
            <Row k={t("checkout.delivery2", { zone: zLabel(zone.id, zone.label) })} v={shipping === 0 ? t("cart.free") : formatBDT(shipping)} />
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-medium">{t("checkout.total")}</dt>
              <dd className="font-serif text-3xl">{formatBDT(total)}</dd>
            </div>
            {(!isBD || currency === "USD") && bdtPerUsd && (
              <p className="text-right text-xs text-stone">{t("checkout.usdRef", { usd: (total / bdtPerUsd).toFixed(2) })}</p>
            )}
          </dl>

          <AnimatePresence>
            {serverError && (
              <motion.p role="alert" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-[2px] bg-clay/10 px-4 py-3 text-sm text-clay">
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!ready || isSubmitting || !hydrated || lines.length === 0}
            className="group relative mt-5 h-13 w-full overflow-hidden rounded-full bg-ink text-sm font-medium text-ivory disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-clay transition-transform duration-500 group-enabled:group-hover:scale-x-100" />
            <span className="relative inline-flex items-center gap-2">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {method === "cod" ? t("checkout.place", { total: formatBDT(total) }) : t("checkout.toPayment", { total: formatBDT(total) })}
            </span>
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-stone">
            {t("checkout.confirmedOnServer")}
          </p>
        </div>
      </aside>
    </form>
  );
}

const input = "h-12 w-full rounded-[2px] border border-ink/15 bg-ivory/60 px-4 text-sm text-ink placeholder:text-stone/60 focus:border-ink focus:outline-none aria-[invalid=true]:border-clay";
const choice = "flex cursor-pointer flex-col gap-1 rounded-[2px] border border-ink/15 bg-ivory/60 px-4 py-3 transition-colors hover:border-ink/40";
const choiceOn = "border-ink bg-ivory";
const err = "mt-1.5 text-xs text-clay";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-6 flex items-baseline gap-3 border-b border-line pb-3">
        <span className="font-serif text-lg text-stone">{n}</span>
        <span className="font-serif text-3xl text-ink">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Field({ label, error, hint, className = "", children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactElement<{ "aria-invalid"?: boolean }> }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs text-stone">{label}</span>
      {children}
      {error ? <span role="alert" className={`block ${err}`}>{error}</span> : hint ? <span className="mt-1.5 block text-[0.7rem] text-stone/80">{hint}</span> : null}
    </label>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone">{k}</dt>
      <dd className={accent ? "text-clay" : "text-ink"}>{v}</dd>
    </div>
  );
}
