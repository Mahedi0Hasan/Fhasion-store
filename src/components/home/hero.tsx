"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";

type Slide = {
  id: string;
  word: string;
  tag: string;
  name: string;
  colour: string;
  swatch: string;
  blurb: string;
  price: string;
  href: string;
  image: { src: string; w: number; h: number; alt: string };
  /** product width relative to the stage, tuned per silhouette */
  scale: number;
  tilt: number;
  bg: [string, string];
};

const SLIDES: Slide[] = [
  {
    id: "cashmere",
    word: "Cashmere",
    tag: "AW26 Knitwear",
    name: "Cloud Cardigan",
    colour: "Ivory",
    swatch: "#f3eee4",
    blurb: "Brushed Mongolian cashmere, light as air and warm as a held breath.",
    price: "৳ 14,500",
    href: "/shop?category=womens-fashion",
    image: { src: "/images/products/cashmere-cardigan.webp", w: 612, h: 729, alt: "Ivory cashmere cardigan floating" },
    scale: 0.4,
    tilt: -4,
    bg: ["#f7f1e7", "#e9dcc8"],
  },
  {
    id: "pleats",
    word: "Pleats",
    tag: "The Pleat Edit",
    name: "Column Dress",
    colour: "Sienna",
    swatch: "#b97a4a",
    blurb: "Knife-pleated georgette that moves a half-second after you do.",
    price: "৳ 16,800",
    href: "/shop?category=dresses",
    image: { src: "/images/products/pleated-collection.webp", w: 531, h: 540, alt: "Pleated dresses in sienna and caramel floating" },
    scale: 0.46,
    tilt: 0,
    bg: ["#f4e8da", "#e2c9ab"],
  },
  {
    id: "knit-pump",
    word: "Grace",
    tag: "New In — Shoes",
    name: "Knit Block Pump",
    colour: "Sand",
    swatch: "#e6d8bf",
    blurb: "A recycled-knit upper on a sculpted heel. All-day, all-occasion.",
    price: "৳ 7,900",
    href: "/shop?category=shoes",
    image: { src: "/images/products/knit-pumps.webp", w: 890, h: 757, alt: "Pair of sand knit block-heel pumps floating" },
    scale: 0.5,
    tilt: 3,
    bg: ["#f6f1e8", "#e7dccb"],
  },
  {
    id: "essentials",
    word: "Ease",
    tag: "Everyday Essentials",
    name: "Brushed Crew",
    colour: "Heather",
    swatch: "#c9c7c3",
    blurb: "Loopback cotton, brushed soft inside. The sweater you'll reach for first.",
    price: "৳ 5,900",
    href: "/shop?category=hoodies",
    image: { src: "/images/products/crew-sweater.webp", w: 588, h: 784, alt: "Heather grey crew sweater floating" },
    scale: 0.42,
    tilt: -2,
    bg: ["#f4efe7", "#e3d8c6"],
  },
];

const AUTOPLAY_MS = 6500;
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const slide = SLIDES[index];
  const prev = SLIDES[(index - 1 + SLIDES.length) % SLIDES.length];
  const next = SLIDES[(index + 1) % SLIDES.length];

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const productScrollY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const wordScrollY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);

  // Pointer → spring-smoothed parallax + 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 16, mass: 0.7 });
  const sy = useSpring(my, { stiffness: 50, damping: 16, mass: 0.7 });
  const rotY = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const rotX = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const prodX = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const prodY = useTransform(sy, [-0.5, 0.5], [-14, 14]);
  const wordX = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const mistX = useTransform(sx, [-0.5, 0.5], [30, -30]);

  const go = useCallback(
    (to: number, d?: number) => {
      const n = (to + SLIDES.length) % SLIDES.length;
      setDir(d ?? (n > index ? 1 : -1));
      setIndex(n);
    },
    [index],
  );

  useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => go(index + 1, 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduce, go]);

  useEffect(() => {
    // Warm the next image so transitions never flash.
    const img = new window.Image();
    img.src = next.image.src;
  }, [next.image.src]);

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  const wordSize = `min(${Math.round(132 / slide.word.length)}vw, 19vw)`;

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Featured pieces"
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
        setPaused(false);
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative isolate flex min-h-[640px] flex-col overflow-hidden md:h-[calc(100svh-6.5rem)] md:min-h-[680px]"
    >
      {/* Background wash, cross-fades per slide */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -z-20"
        animate={{ background: `radial-gradient(120% 90% at 50% 30%, ${slide.bg[0]} 0%, ${slide.bg[1]} 100%)` }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-70" />

      {/* Tag pill */}
      <div className="relative z-10 flex justify-center pt-8 md:pt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={slide.tag}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ivory/70 py-1 pl-1 pr-3.5 text-[0.72rem] text-stone backdrop-blur"
          >
            <span className="rounded-full bg-ink px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-ivory">New</span>
            {slide.tag}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Stage */}
      <div className="relative flex-1" style={{ perspective: 1400 }}>
        {/* Giant word */}
        <motion.div
          aria-hidden="true"
          style={{ x: wordX, y: wordScrollY }}
          className="pointer-events-none absolute inset-x-0 top-[2%] flex select-none justify-center md:top-[0%]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={slide.word}
              className="block whitespace-nowrap font-serif leading-[0.85] tracking-[-0.035em] text-[#d8c5a8]"
              style={{ fontSize: wordSize }}
            >
              {slide.word.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: "40%", filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: "-25%", filter: "blur(6px)" }}
                  transition={{ duration: 0.8, ease: EASE, delay: reduce ? 0 : i * 0.035 }}
                >
                  {ch}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Edge previews (BOSS-style carousel depth) */}
        <EdgePreview slide={prev} side="left" onClick={() => go(index - 1, -1)} />
        <EdgePreview slide={next} side="right" onClick={() => go(index + 1, 1)} />

        {/* Pedestal */}
        <Pedestal />

        {/* Product */}
        <motion.div style={{ y: productScrollY }} className="absolute inset-0">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={slide.id}
              custom={dir}
              className="absolute inset-x-0 bottom-[29%] top-[16%] flex items-end justify-center md:bottom-[26%] md:top-[22%]"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : `${d * 30}%`, scale: reduce ? 1 : 0.8, rotate: reduce ? 0 : d * 8 }),
                center: { opacity: 1, x: "0%", scale: 1, rotate: 0 },
                exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : `${d * -30}%`, scale: reduce ? 1 : 0.8, rotate: reduce ? 0 : d * -8 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 1, ease: EASE }}
            >
              <motion.div
                style={{ x: prodX, y: prodY, rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
                className="relative h-full"
              >
                <motion.div
                  className="relative h-full max-w-[min(calc(var(--s)*1.75),86vw)] md:max-w-[var(--s)]"
                  animate={reduce ? undefined : { y: [0, -16, 0], rotate: [slide.tilt, slide.tilt + 1.5, slide.tilt] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ aspectRatio: `${slide.image.w} / ${slide.image.h}`, ["--s" as string]: `${slide.scale * 100}vw` }}
                >
                  <Image
                    src={slide.image.src}
                    alt={slide.image.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 80vw, 45vw"
                    className="object-contain drop-shadow-[0_40px_40px_rgba(90,60,30,0.28)]"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Floating contact shadow on the pedestal */}
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[25%] left-1/2 h-6 w-[min(30vw,15rem)] -translate-x-1/2 rounded-[50%] bg-[#6b4a2a]/25 blur-xl md:bottom-[22.5%]"
            animate={reduce ? undefined : { scaleX: [1, 0.82, 1], opacity: [0.9, 0.55, 0.9] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Mist */}
        <motion.div aria-hidden="true" style={{ x: mistX }} className="pointer-events-none absolute inset-x-[-10%] bottom-[-6%] h-[38%]">
          <Mist reduce={reduce} />
        </motion.div>

        {/* Swatch selector (left) */}
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 md:bottom-auto md:left-[clamp(1.25rem,6vw,6rem)] md:top-[58%] md:translate-x-0">
          <div role="tablist" aria-label="Choose a piece" className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-ivory/70 p-1.5 shadow-[0_8px_24px_-12px_rgba(60,40,20,0.35)] backdrop-blur">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`${s.name}, ${s.colour}`}
                onClick={() => go(i)}
                className="relative grid size-7 place-items-center rounded-full"
              >
                {i === index && (
                  <motion.span layoutId="swatch-ring" className="absolute inset-0 rounded-full ring-1 ring-ink" transition={{ duration: 0.5, ease: EASE }} />
                )}
                <span className="size-[18px] rounded-full ring-1 ring-black/10" style={{ background: s.swatch }} />
              </button>
            ))}
          </div>
        </div>

        {/* Product card (right) */}
        <div className="absolute right-[clamp(1.25rem,6vw,6rem)] top-[52%] z-20 hidden w-60 md:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            >
              <p className="font-serif text-3xl leading-tight text-ink">{slide.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone">{slide.colour}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone">{slide.blurb}</p>
              <div className="mt-5 flex items-center gap-4">
                <Link
                  href={slide.href}
                  className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full bg-ink px-5 text-xs font-medium text-ivory"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-clay transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-x-100" />
                  <ShoppingBag className="relative size-3.5" />
                  <span className="relative">Shop now</span>
                </Link>
                <span className="font-serif text-xl text-ink">{slide.price}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Arrows + counter */}
        <div className="absolute bottom-8 right-[clamp(1.25rem,6vw,6rem)] z-20 hidden items-center gap-4 md:flex">
          <span className="font-serif text-lg tabular-nums text-stone">
            <span className="text-ink">{String(index + 1).padStart(2, "0")}</span> / {String(SLIDES.length).padStart(2, "0")}
          </span>
          <RoundButton label="Previous piece" onClick={() => go(index - 1, -1)}>
            <ArrowLeft className="size-4" />
          </RoundButton>
          <RoundButton label="Next piece" onClick={() => go(index + 1, 1)}>
            <ArrowRight className="size-4" />
          </RoundButton>
        </div>

        {/* Autoplay progress */}
        {!reduce && (
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-20 h-px bg-ink/5">
            <motion.div
              key={`${slide.id}-${paused}`}
              className="h-full bg-ink/40"
              initial={{ width: paused ? "0%" : "0%" }}
              animate={{ width: paused ? "0%" : "100%" }}
              transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {/* Mobile product strip */}
      <div className="relative z-20 border-t border-ink/5 bg-ivory/60 px-5 py-4 backdrop-blur md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-serif text-2xl leading-none text-ink">{slide.name}</p>
              <p className="mt-1 text-xs text-stone">{slide.colour} · {slide.price}</p>
            </div>
            <Link href={slide.href} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-xs font-medium text-ivory">
              <ShoppingBag className="size-3.5" /> Shop now
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="sr-only" aria-live="polite">
        {slide.name} in {slide.colour}, {slide.price}. Piece {index + 1} of {SLIDES.length}.
      </p>
    </section>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function Pedestal() {
  return (
    <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[29%] w-[min(52vw,19rem)] -translate-x-1/2 md:h-[26%]">
      {/* top face */}
      <div className="absolute inset-x-0 top-0 z-10 aspect-[5/1] -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_40%_40%,#fbf6ee_0%,#eadcc6_70%,#dccab0_100%)] shadow-[inset_0_-6px_12px_rgba(120,90,60,0.12)]" />
      {/* body */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#d3bd9d_0%,#eadcc6_30%,#f3e8d8_48%,#e1cfb4_72%,#c8b08c_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(251,248,242,0.9)_100%)]" />
    </div>
  );
}

function Mist({ reduce }: { reduce: boolean }) {
  const puffs = [
    { l: "0%", b: "-10%", w: "38%", h: "90%", d: 14 },
    { l: "22%", b: "-25%", w: "34%", h: "85%", d: 18 },
    { l: "46%", b: "-18%", w: "36%", h: "95%", d: 16 },
    { l: "68%", b: "-12%", w: "34%", h: "85%", d: 20 },
    { l: "10%", b: "-40%", w: "80%", h: "80%", d: 22 },
  ];
  return (
    <>
      {puffs.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-ivory/90 blur-3xl"
          style={{ left: p.l, bottom: p.b, width: p.w, height: p.h }}
          animate={reduce ? undefined : { x: ["0%", i % 2 ? "6%" : "-6%", "0%"], opacity: [0.75, 0.95, 0.75] }}
          transition={{ duration: p.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function EdgePreview({ slide, side, onClick }: { slide: Slide; side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${side === "left" ? "Previous" : "Next"}: ${slide.name}`}
      className={`group absolute top-[16%] z-10 hidden h-[38%] w-[12vw] max-w-44 lg:block ${
        side === "left" ? "left-[-2vw]" : "right-[-2vw]"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={slide.id}
          className="relative block size-full"
          initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <Image
            src={slide.image.src}
            alt=""
            fill
            sizes="12vw"
            className="object-contain opacity-30 blur-[1.5px] grayscale-[30%] transition duration-500 group-hover:opacity-60 group-hover:blur-0"
          />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-ink/15 bg-ivory/40 text-ink backdrop-blur transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
    >
      {children}
    </button>
  );
}
