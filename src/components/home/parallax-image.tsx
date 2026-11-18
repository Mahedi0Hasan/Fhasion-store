"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** Full-bleed image that drifts slightly slower than the page. */
export function ParallaxImage({ src, alt, position = "50% 50%" }: { src: string; alt: string; position?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-[-10%_0]">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: position }} />
      </motion.div>
    </div>
  );
}
