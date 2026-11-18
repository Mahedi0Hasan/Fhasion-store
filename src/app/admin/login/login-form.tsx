"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "./actions";

const input = "h-12 w-full rounded-[2px] border border-ink/15 bg-ivory px-4 text-sm focus:border-ink focus:outline-none";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="mt-10 space-y-4 rounded-[2px] bg-ivory/60 p-6">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="mb-1.5 block text-xs text-stone">Email</span>
        <input name="email" type="email" autoComplete="username" required className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-stone">Password</span>
        <input name="password" type="password" autoComplete="current-password" required minLength={8} className={input} />
      </label>
      {state.error && <p role="alert" className="text-sm text-clay">{state.error}</p>}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-ivory disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" />} Sign in
      </button>
    </form>
  );
}
