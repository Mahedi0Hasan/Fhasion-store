export default function Loading() {
  return (
    <div className="container-x pb-24 pt-10 md:pt-14" aria-busy="true" aria-label="Loading products / পণ্য লোড হচ্ছে">
      <div className="h-3 w-24 animate-pulse rounded bg-sand" />
      <div className="mt-5 h-16 w-72 animate-pulse rounded bg-sand" />
      <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse bg-sand" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
