"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { newsletterSchema } from "@/lib/validation/newsletter";
import { RevealWords } from "@/components/animations/reveal";

type State = { status: "idle" | "loading" | "success" | "error"; message?: string };

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      setState({ status: "error", message: parsed.error.issues[0]?.message });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setState({ status: "success", message: "You're on the list. Welcome to DEMO." });
      setEmail("");
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  return (
    <section className="bg-sand/60">
      <div className="container-x py-24 text-center md:py-32">
        <p className="label mb-5 text-stone">The DEMO letter</p>
        <h2 className="mx-auto max-w-3xl font-serif text-5xl leading-[0.95] text-ink md:text-7xl">
          <RevealWords text="New arrivals, first. Never too often." />
        </h2>
        <form onSubmit={onSubmit} noValidate className="mx-auto mt-12 flex max-w-md items-center gap-2 border-b border-ink/30 pb-2 focus-within:border-ink">
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input
            id="nl-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={state.status === "error"}
            aria-describedby="nl-msg"
            className="h-11 flex-1 bg-transparent text-base text-ink placeholder:text-stone/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={state.status === "loading"}
            aria-label="Subscribe"
            className="grid size-11 place-items-center rounded-full bg-ink text-ivory transition-transform duration-300 hover:scale-105 disabled:opacity-60"
          >
            {state.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : state.status === "success" ? <Check className="size-4" /> : <ArrowRight className="size-4" />}
          </button>
        </form>
        <div id="nl-msg" aria-live="polite" className="mt-4 min-h-5 text-sm">
          <AnimatePresence mode="wait">
            {state.message && (
              <motion.p
                key={state.message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={state.status === "error" ? "text-clay" : "text-ink"}
              >
                {state.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-2 text-xs text-stone">By subscribing you agree to our privacy policy. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
