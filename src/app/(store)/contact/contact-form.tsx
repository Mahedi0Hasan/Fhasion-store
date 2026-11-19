"use client";

import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { CONTACT_TOPICS, contactSchema, type ContactInput } from "@/lib/validation/contact";

const input = "h-12 w-full rounded-[2px] border border-ink/15 bg-cream/40 px-4 text-sm text-ink focus:border-ink focus:outline-none aria-[invalid=true]:border-clay";

export function ContactForm() {
  const { t, tm } = useI18n();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, reset, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { topic: "order" },
    mode: "onTouched",
  });

  async function onSubmit(v: ContactInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.field) setError(data.field as FieldPath<ContactInput>, { message: data.error });
        setServerError(data.error ?? t("checkout.generic"));
        return;
      }
      reset({ topic: "order" });
      setDone(true);
    } catch {
      setServerError(t("checkout.network"));
    }
  }

  const err = (k: keyof ContactInput) => errors[k]?.message && <span role="alert" className="mt-1.5 block text-xs text-clay">{tm(errors[k]?.message)}</span>;

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex gap-3 rounded-[2px] bg-sand/70 p-5" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ink" strokeWidth={1.5} />
          <div>
            <p className="text-ink">{t("contact.sent")}</p>
            <button type="button" onClick={() => setDone(false)} className="mt-3 text-sm underline underline-offset-4">{t("contact.form")}</button>
          </div>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-4 sm:grid-cols-2" exit={{ opacity: 0 }}>
          {/* Honeypot, hidden from people and screen readers */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.name")}</span>
            <input {...register("name")} autoComplete="name" aria-invalid={!!errors.name} className={input} />{err("name")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.emailField")}</span>
            <input {...register("email")} type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} className={input} />{err("email")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.phoneOpt")}</span>
            <input {...register("phone")} type="tel" autoComplete="tel" className={input} />{err("phone")}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.topic")}</span>
            <select {...register("topic")} className={input}>
              {CONTACT_TOPICS.map((k) => <option key={k} value={k}>{t(`contact.topics.${k}`)}</option>)}
            </select>{err("topic")}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.orderOpt")}</span>
            <input {...register("order_number")} placeholder="DM-261118-A1B2C3" autoCapitalize="characters" aria-invalid={!!errors.order_number} className={`${input} uppercase placeholder:normal-case`} />{err("order_number")}
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs text-stone">{t("contact.message")}</span>
            <textarea {...register("message")} rows={5} aria-invalid={!!errors.message} className={`${input} h-auto py-3`} />{err("message")}
          </label>
          {serverError && <p role="alert" className="rounded-[2px] bg-clay/10 px-4 py-3 text-sm text-clay sm:col-span-2">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-8 text-sm font-medium text-ivory disabled:opacity-60 sm:col-span-2 sm:w-fit">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />} {isSubmitting ? t("contact.sending") : t("contact.send")}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
