import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track your order", description: "Track a DEMO order with your order number and phone." };

export default function TrackOrderPage() {
  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      <p className="label text-stone">Order tracking</p>
      <h1 className="mt-3 font-serif text-5xl leading-none text-ink md:text-7xl">Where&apos;s my order?</h1>
      <p className="mt-4 text-stone">Enter the order number from your confirmation and the phone number you used at checkout.</p>
      <TrackForm />
    </div>
  );
}
