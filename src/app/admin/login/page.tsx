import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="grid min-h-svh place-items-center bg-cream px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-4xl tracking-[0.28em] text-ink">DEMO</p>
        <p className="label mt-3 text-center text-stone">Store dashboard</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
