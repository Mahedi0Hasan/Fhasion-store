"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";

export function WishButton({ productId, name, className = "", withLabel = false }: { productId: string; name: string; className?: string; withLabel?: boolean }) {
  const { isWished, toggleWish, hydrated } = useStore();
  const on = hydrated && isWished(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWish(productId)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={className}
    >
      <motion.span key={String(on)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="inline-flex">
        <Heart className="size-[1.05rem]" strokeWidth={1.5} fill={on ? "currentColor" : "none"} />
      </motion.span>
      {withLabel && <span>{on ? "Saved" : "Save to wishlist"}</span>}
    </button>
  );
}
