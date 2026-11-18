import Image from "next/image";
import Link from "next/link";
import { formatBDT, type Product } from "@/lib/catalog";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = product.images[0];
  const onSale = product.salePriceBDT !== undefined && product.salePriceBDT < product.priceBDT;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-sand">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, 25vw"
          style={img.position ? { objectPosition: img.position } : undefined}
          className={`transition-transform duration-[1200ms] ease-[var(--ease-soft)] group-hover:scale-[1.06] ${
            img.fit === "contain" ? "object-contain p-[12%] drop-shadow-[0_24px_24px_rgba(90,60,30,0.2)]" : "object-cover"
          }`}
        />
        <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
          {product.tags.includes("new") && <Badge>New</Badge>}
          {onSale && <Badge tone="clay">Sale</Badge>}
        </div>
        <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-full bg-ivory/90 py-2.5 text-center text-xs font-medium text-ink opacity-0 backdrop-blur transition duration-500 ease-[var(--ease-soft)] group-hover:translate-y-0 group-hover:opacity-100">
          View piece
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl leading-tight text-ink">{product.name}</h3>
          <p className="mt-0.5 text-xs text-stone">{product.colour}</p>
        </div>
        <div className="text-right text-sm">
          {onSale ? (
            <>
              <p className="font-medium text-clay">{formatBDT(product.salePriceBDT!)}</p>
              <p className="text-xs text-stone line-through">{formatBDT(product.priceBDT)}</p>
            </>
          ) : (
            <p className="font-medium text-ink">{formatBDT(product.priceBDT)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "clay" }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-wider text-ivory ${tone === "clay" ? "bg-clay" : "bg-ink"}`}>
      {children}
    </span>
  );
}
