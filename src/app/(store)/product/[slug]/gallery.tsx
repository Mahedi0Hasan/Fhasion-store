"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ProductImage } from "@/lib/catalog";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const reduce = useReducedMotion();
  const img = images[i];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col" role="tablist" aria-label={`${name} images`}>
          {images.map((im, n) => (
            <button
              key={im.src}
              role="tab"
              aria-selected={n === i}
              aria-label={`Image ${n + 1}`}
              onClick={() => setI(n)}
              className={`relative h-24 w-20 overflow-hidden bg-sand transition-opacity ${n === i ? "opacity-100 ring-1 ring-ink" : "opacity-60 hover:opacity-100"}`}
            >
              <Image src={im.src} alt="" fill sizes="80px" style={im.position ? { objectPosition: im.position } : undefined} className={im.fit === "contain" ? "object-contain p-1.5" : "object-cover"} />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden bg-sand"
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={img.src} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              style={{
                objectPosition: img.position,
                transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%",
                transform: zoom ? "scale(1.6)" : "scale(1)",
              }}
              className={`transition-transform duration-500 ease-[var(--ease-soft)] ${img.fit === "contain" ? "object-contain p-[10%] drop-shadow-[0_30px_30px_rgba(90,60,30,0.22)]" : "object-cover"}`}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
