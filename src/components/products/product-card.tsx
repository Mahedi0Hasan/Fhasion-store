import Image from "next/image";
import Link from "next/link";
import { formatBDT, totalStock, type Product } from "@/lib/catalog";
import { WishButton } from "./wish-button";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = product.images[0];
  const onSale = product.salePriceBDT !== undefined && product.salePriceBDT < product.priceBDT;
  const soldOut = totalStock(product) === 0;
  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
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
            {soldOut && <Badge tone="stone">Sold out</Badge>}
          </div>
          <span className="absolute inset-x-3 bottom-3 hidden translate-y-3 rounded-full bg-ivory/90 py-2.5 text-center text-xs font-medium text-ink opacity-0 backdrop-blur transition duration-500 ease-[var(--ease-soft)] group-hover:translate-y-0 group-hover:opacity-100 md:block">
            View piece
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-lg leading-tight text-ink md:text-xl">{product.name}</h3>
            <p className="mt-0.5 text-xs text-stone">{product.colour}</p>
          </div>
          <div className="shrink-0 text-right text-sm">
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
      <WishButton
        productId={product.id}
        name={product.name}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ivory/80 text-ink backdrop-blur transition-transform duration-300 hover:scale-110"
      />
    </div>
  );
}

function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "clay" | "stone" }) {
  const bg = tone === "clay" ? "bg-clay" : tone === "stone" ? "bg-stone" : "bg-ink";
  return <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-wider text-ivory ${bg}`}>{children}</span>;
}
