"use client";

export function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      className="inline-flex h-10 items-center rounded-full border border-clay/40 px-5 text-sm font-medium text-clay hover:bg-clay hover:text-ivory"
      onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
