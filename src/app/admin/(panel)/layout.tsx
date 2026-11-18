import type { Metadata } from "next";
import { requireStaff } from "@/lib/admin/auth";
import { AdminNav } from "./nav";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · DEMO admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="min-h-svh bg-cream md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-ivory md:sticky md:top-0 md:h-svh md:border-b-0 md:border-r">
        <div className="flex h-16 items-center justify-between px-5 md:h-20">
          <span className="font-serif text-2xl tracking-[0.25em]">DEMO</span>
          <span className="rounded-full bg-sand px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-stone">{staff.role}</span>
        </div>
        <AdminNav isAdmin={staff.role === "admin"} />
        <div className="hidden border-t border-line px-5 py-4 text-xs text-stone md:absolute md:inset-x-0 md:bottom-0 md:block">
          <p className="truncate">{staff.email}</p>
          <form action={signOut}><button className="mt-2 underline underline-offset-4 hover:text-ink">Sign out</button></form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
