import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60svh] flex-col items-start justify-center gap-5 py-24">
      <p className="label text-stone">404</p>
      <h1 className="font-serif text-6xl text-ink md:text-8xl">This page has wandered off.</h1>
      <p className="max-w-md text-stone">It may have moved, or it&apos;s still being stitched together.</p>
      <Link href="/shop" className="mt-2 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-ivory">Back to the shop</Link>
    </div>
  );
}
