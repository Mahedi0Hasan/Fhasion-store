/**
 * Demo catalogue used by the storefront until Phase 4 moves products into
 * Supabase. Shapes mirror the planned `products` / `product_variants` /
 * `inventory` tables so components won't change when the data source does.
 *
 * Images are user-supplied placeholders — replace with licensed or owned
 * photography before launch (see README).
 */
export type ProductImage = { src: string; alt: string; fit: "contain" | "cover"; position?: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  gender: "women" | "men" | "unisex";
  colour: string;
  colourHex: string;
  priceBDT: number;
  salePriceBDT?: number;
  description: string;
  details: string[];
  images: ProductImage[];
  /** size → units in stock */
  stock: Record<string, number>;
  tags: ("new" | "bestseller")[];
  createdAt: string;
  popularity: number;
  /** Optional Bangla content; any missing field falls back to English. */
  bn?: { name?: string; colour?: string; description?: string; details?: string[] };
};

export type Category = { slug: string; name: string; nameBn?: string };

export const DEMO_CATEGORIES: Category[] = [
  { slug: "womens-fashion", name: "Women's Fashion", nameBn: "নারীদের ফ্যাশন" },
  { slug: "mens-fashion", name: "Men's Fashion", nameBn: "পুরুষদের ফ্যাশন" },
  { slug: "kids-fashion", name: "Kids' Fashion", nameBn: "শিশুদের ফ্যাশন" },
  { slug: "t-shirts", name: "T-shirts", nameBn: "টি-শার্ট" },
  { slug: "shirts", name: "Shirts", nameBn: "শার্ট" },
  { slug: "pants", name: "Pants", nameBn: "প্যান্ট" },
  { slug: "jeans", name: "Jeans", nameBn: "জিন্স" },
  { slug: "dresses", name: "Dresses", nameBn: "ড্রেস" },
  { slug: "jackets", name: "Jackets", nameBn: "জ্যাকেট" },
  { slug: "hoodies", name: "Hoodies & Knitwear", nameBn: "হুডি ও নিটওয়্যার" },
  { slug: "shoes", name: "Shoes", nameBn: "জুতা" },
  { slug: "bags", name: "Bags", nameBn: "ব্যাগ" },
  { slug: "accessories", name: "Accessories", nameBn: "অ্যাক্সেসরিজ" },
];

/** Gender-level categories match by `gender`; the rest by `category`. */
const GENDER_CATEGORY: Record<string, Product["gender"]> = {
  "womens-fashion": "women",
  "mens-fashion": "men",
};

/** Demo catalogue: seed source and fallback when no database is connected. */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1",
    bn: { name: "ক্লাউড ক্যাশমিয়ার কার্ডিগান", colour: "আইভরি", description: "ব্রাশড মঙ্গোলিয়ান ক্যাশমিয়ারে তৈরি ক্রপড ভি-নেক কার্ডিগান। পালকের মতো হালকা, একটু বক্সি গড়ন, মাদার-অফ-পার্ল বোতাম আর হাতা ও নিচে নরম রিব।", details: ["১০০% গ্রেড-এ ক্যাশমিয়ার", "মাদার-অফ-পার্ল বোতাম", "ঢিলেঢালা, ক্রপড ফিট", "ঠান্ডা পানিতে হাতে ধুয়ে সমতলে শুকান"] },
    slug: "cloud-cashmere-cardigan-ivory",
    name: "Cloud Cashmere Cardigan",
    category: "hoodies",
    gender: "women",
    colour: "Ivory",
    colourHex: "#f3eee4",
    priceBDT: 14500,
    description:
      "A cropped V-neck cardigan in brushed Mongolian cashmere. Featherlight, gently boxy, finished with mother-of-pearl buttons and a soft rib at cuff and hem.",
    details: ["100% Grade-A cashmere", "Mother-of-pearl buttons", "Relaxed, cropped fit", "Hand wash cold, dry flat"],
    images: [
      { src: "/images/products/cashmere-cardigan.webp", alt: "Ivory cashmere cardigan", fit: "contain" },
      { src: "/images/editorial/cardigan-desert.webp", alt: "Ivory cashmere cardigan floating over desert dunes", fit: "cover", position: "78% 50%" },
    ],
    stock: { XS: 3, S: 6, M: 4, L: 0 },
    tags: ["new"],
    createdAt: "2026-11-10",
    popularity: 88,
  },
  {
    id: "p2",
    bn: { name: "প্লিটেড কলাম ড্রেস", colour: "সিয়েনা", description: "নাইফ-প্লিটেড জর্জেটে মক-নেক কলাম ড্রেস, ওপরে একটি ক্রপড প্যানেল যা চলার সাথে স্কার্টের ওপর ভেসে থাকে।", details: ["১০০% রিসাইকেলড পলিয়েস্টার জর্জেট", "স্থায়ী নাইফ প্লিট", "লাইনিং ছাড়া, সহজে পরা যায়", "ডেলিকেট মোডে মেশিনে ধোয়া যায়"] },
    slug: "pleated-column-dress-sienna",
    name: "Pleated Column Dress",
    category: "dresses",
    gender: "women",
    colour: "Sienna",
    colourHex: "#b97a4a",
    priceBDT: 16800,
    description:
      "A mock-neck column dress in knife-pleated georgette, with a layered cropped top panel that floats over the skirt as you move.",
    details: ["100% recycled polyester georgette", "Permanent knife pleats", "Unlined, pull-on", "Machine wash delicate"],
    images: [{ src: "/images/products/pleated-collection.webp", alt: "Pleated column dresses in sienna tones", fit: "contain" }],
    stock: { XS: 2, S: 5, M: 5, L: 3, XL: 1 },
    tags: ["new"],
    createdAt: "2026-11-08",
    popularity: 74,
  },
  {
    id: "p3",
    bn: { name: "নিট ব্লক পাম্প", colour: "স্যান্ড", description: "স্কয়ার-টো পাম্প, সেলাইবিহীন রিসাইকেলড নিটের উপরিভাগ আর ৫ সেমি ভাস্কর্য-আকৃতির ব্লক হিল। সারাদিন আরামে পরা যায়, সন্ধ্যার জন্যও মানানসই।", details: ["রিসাইকেলড বোতল থেকে বোনা", "৫ সেমি ব্লক হিল", "কুশনযুক্ত খোলা যায় এমন ইনসোল", "উপরিভাগ মেশিনে ধোয়া যায়"] },
    slug: "knit-block-pump-sand",
    name: "Knit Block Pump",
    category: "shoes",
    gender: "women",
    colour: "Sand",
    colourHex: "#e6d8bf",
    priceBDT: 7900,
    salePriceBDT: 6900,
    description:
      "A square-toe pump with a seamless recycled-knit upper on a sculpted 5 cm block heel. Soft enough for all day, sharp enough for evening.",
    details: ["Knit from recycled bottles", "5 cm sculpted block heel", "Cushioned removable insole", "Machine washable upper"],
    images: [{ src: "/images/products/knit-pumps.webp", alt: "Sand knit block-heel pumps", fit: "contain" }],
    stock: { "36": 4, "37": 6, "38": 2, "39": 0, "40": 1 },
    tags: ["new"],
    createdAt: "2026-11-05",
    popularity: 91,
  },
  {
    id: "p4",
    bn: { name: "ব্রাশড ক্রু সোয়েটার", colour: "হেদার গ্রে", description: "ভারী লুপব্যাক কটনের ক্রু সোয়েটার, ভেতরে নরম ব্রাশ করা, নামানো কাঁধ আর ঢিলেঢালা গড়ন। যে সোয়েটার আপনি সবার আগে হাতে নেবেন।", details: ["১০০% অর্গানিক কটন লুপব্যাক, ৪২০ জিএসএম", "ভেতরে ব্রাশ করা", "রিল্যাক্সড ফিট", "ঠান্ডা পানিতে মেশিনে ধোয়া যায়"] },
    slug: "brushed-crew-sweater-heather",
    name: "Brushed Crew Sweater",
    category: "hoodies",
    gender: "men",
    colour: "Heather Grey",
    colourHex: "#c9c7c3",
    priceBDT: 5900,
    description:
      "A heavyweight loopback-cotton crew, brushed soft on the inside, with a dropped shoulder and generous body. The sweater you'll reach for first.",
    details: ["100% organic cotton loopback, 420 gsm", "Brushed interior", "Relaxed fit", "Machine wash cold"],
    images: [{ src: "/images/products/crew-sweater.webp", alt: "Heather grey crew sweater", fit: "contain" }],
    stock: { S: 8, M: 12, L: 9, XL: 5, XXL: 2 },
    tags: ["bestseller"],
    createdAt: "2026-09-20",
    popularity: 97,
  },
  {
    id: "p5",
    bn: { name: "হেরিটেজ ট্রেঞ্চ কোট", colour: "স্টোন", description: "পানি-প্রতিরোধী কটন গ্যাবার্ডিনে ডাবল-ব্রেস্টেড ট্রেঞ্চ, স্টর্ম ফ্ল্যাপ, এপোলেট আর বেল্টসহ কোমর। লম্বা কাট, ঢিলেঢালা পরার জন্য।", details: ["১০০% কটন গ্যাবার্ডিন, পানি-প্রতিরোধী", "হর্ন-ধাঁচের বোতাম", "খোলা যায় এমন বেল্ট", "শুধু ড্রাই ক্লিন"] },
    slug: "heritage-trench-coat-stone",
    name: "Heritage Trench Coat",
    category: "jackets",
    gender: "unisex",
    colour: "Stone",
    colourHex: "#cdb48e",
    priceBDT: 22500,
    description:
      "A double-breasted trench in water-resistant cotton gabardine, with storm flap, epaulettes and a belted waist. Cut long and worn loose.",
    details: ["100% cotton gabardine, water-resistant", "Horn-effect buttons", "Detachable belt", "Dry clean only"],
    images: [{ src: "/images/editorial/trench-chair.webp", alt: "Stone trench coat draped over a chair", fit: "cover", position: "50% 30%" }],
    stock: { XS: 1, S: 3, M: 4, L: 2, XL: 0 },
    tags: ["bestseller"],
    createdAt: "2026-08-15",
    popularity: 85,
  },
  {
    id: "p6",
    bn: { name: "ওয়াইড-লেগ উল ট্রাউজার", colour: "ওট", description: "হাই-রাইজ, ডাবল-প্লিটেড ট্রাউজার, নরম উল ব্লেন্ডে তৈরি, মেঝে পর্যন্ত চওড়া সোজা লাইনে নেমে আসে।", details: ["৭০% উল, ৩০% ভিসকস", "সামনে দুটি প্লিট", "পাশে পকেট", "ড্রাই ক্লিন করার পরামর্শ"] },
    slug: "wide-leg-wool-trouser-oat",
    name: "Wide-Leg Wool Trouser",
    category: "pants",
    gender: "women",
    colour: "Oat",
    colourHex: "#d9c7a6",
    priceBDT: 8900,
    description:
      "A high-rise, double-pleated trouser in fluid wool blend that falls in a clean, wide line to the floor.",
    details: ["70% wool, 30% viscose", "Double front pleats", "Side slip pockets", "Dry clean recommended"],
    images: [
      { src: "/images/editorial/beige-tailoring.webp", alt: "Oat wide-leg trousers with long coat", fit: "cover", position: "50% 70%" },
    ],
    stock: { XS: 2, S: 4, M: 6, L: 3 },
    tags: ["new"],
    createdAt: "2026-11-12",
    popularity: 69,
  },
  {
    id: "p7",
    bn: { name: "প্লিটেড ম্যাক্সি ড্রেস", colour: "স্যান্ড", description: "হাই-নেক ম্যাক্সি ড্রেস, ফিটেড নিট বডিস আর পুরো সানরে-প্লিটেড স্কার্ট যা প্রতিটি বাতাসে দোলে।", details: ["নিট বডিস, প্লিটেড শিফন স্কার্ট", "পেছনে লুকানো চেইন", "স্কার্টে পূর্ণ লাইনিং", "শুধু ড্রাই ক্লিন"] },
    slug: "pleated-maxi-dress-sand",
    name: "Pleated Maxi Dress",
    category: "dresses",
    gender: "women",
    colour: "Sand",
    colourHex: "#d8c3a5",
    priceBDT: 17200,
    salePriceBDT: 14900,
    description:
      "A high-neck maxi dress with a fitted knit bodice and a full sunray-pleated skirt that catches every breeze.",
    details: ["Knit bodice, pleated chiffon skirt", "Concealed back zip", "Fully lined skirt", "Dry clean only"],
    images: [{ src: "/images/editorial/pleated-dunes.webp", alt: "Sand pleated maxi dress on a stone plinth", fit: "cover", position: "55% 40%" }],
    stock: { XS: 0, S: 2, M: 3, L: 1 },
    tags: ["bestseller"],
    createdAt: "2026-07-30",
    popularity: 80,
  },
  {
    id: "p8",
    bn: { name: "লিনেন স্যুট সেট", colour: "ফ্ল্যাক্স", description: "ধোয়া বেলজিয়ান ফ্ল্যাক্সে আনস্ট্রাকচার্ড সিঙ্গেল-ব্রেস্টেড ব্লেজার আর মানানসই চওড়া ট্রাউজার। ঢাকার গরমে আরামদায়ক, সব জায়গায় সুন্দর।", details: ["১০০% বেলজিয়ান লিনেন", "লাইনিং ছাড়া, হাফ-ক্যানভাস ব্লেজার", "সেট হিসেবে বিক্রি", "ঠান্ডা পানিতে মেশিনে ধুয়ে ঝুলিয়ে শুকান"] },
    slug: "linen-suit-set-flax",
    name: "Linen Suit Set",
    category: "womens-fashion",
    gender: "women",
    colour: "Flax",
    colourHex: "#c9bba3",
    priceBDT: 19500,
    description:
      "An unstructured single-breasted blazer and matching wide trouser in washed Belgian flax. Breathes in Dhaka heat, drapes everywhere else.",
    details: ["100% Belgian linen", "Unlined, half-canvas blazer", "Sold as a set", "Machine wash cold, line dry"],
    images: [{ src: "/images/editorial/linen-duo.webp", alt: "Flax linen suit and linen skirt set", fit: "cover", position: "30% 40%" }],
    stock: { XS: 2, S: 3, M: 3, L: 2, XL: 1 },
    tags: ["bestseller"],
    createdAt: "2026-06-18",
    popularity: 77,
  },
];

/* ───────────────────────── helpers ───────────────────────── */

/** Swap in Bangla content where it exists; English stays as the fallback. */
export function localizeProduct(p: Product, locale: "en" | "bn"): Product {
  if (locale !== "bn" || !p.bn) return p;
  return {
    ...p,
    name: p.bn.name || p.name,
    colour: p.bn.colour || p.colour,
    description: p.bn.description || p.description,
    details: p.bn.details?.length ? p.bn.details : p.details,
    images: p.images.map((i) => ({ ...i, alt: p.bn?.name ? `${p.bn.name}${p.bn.colour ? `, ${p.bn.colour}` : ""}` : i.alt })),
  };
}
export const localizeCategory = (c: Category, locale: "en" | "bn"): Category => (locale === "bn" && c.nameBn ? { ...c, name: c.nameBn } : c);

export const byTag = (list: Product[], tag: Product["tags"][number]) => list.filter((p) => p.tags.includes(tag));
export const priceOf = (p: Product) => p.salePriceBDT ?? p.priceBDT;
export const totalStock = (p: Product) => Object.values(p.stock).reduce((a, b) => a + b, 0);
export const categoryName = (cats: Category[], slug: string) => cats.find((c) => c.slug === slug)?.name;

export function formatBDT(amount: number) {
  return `৳ ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

export function relatedProducts(list: Product[], p: Product, n = 4) {
  return list.filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: (x.category === p.category ? 2 : 0) + (x.gender === p.gender ? 1 : 0) + x.popularity / 1000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.x);
}

/* ───────────────────────── shop query ───────────────────────── */

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

export type ShopQuery = {
  q?: string;
  category?: string;
  sizes: string[];
  colours: string[];
  min?: number;
  max?: number;
  sort: Sort;
  page: number;
};

export const PAGE_SIZE = 6;

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
export function facets(list: Product[]) {
  const sizes = Array.from(new Set(list.flatMap((p) => Object.keys(p.stock)))).sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  // `name` is the stable English key used in URLs; `nameBn` is only for display.
  const colours = Array.from(new Map(list.map((p) => [p.colour, { hex: p.colourHex, nameBn: p.bn?.colour }])).entries()).map(([name, v]) => ({ name, hex: v.hex, nameBn: v.nameBn }));
  const max = list.length ? Math.ceil(Math.max(...list.map(priceOf)) / 1000) * 1000 : 0;
  return { sizes, colours, price: { min: 0, max } };
}
export type Facets = ReturnType<typeof facets>;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);
const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Parse untrusted URL params into a safe, bounded query. */
export function parseShopQuery(sp: Params, cats: Category[], f: Facets): ShopQuery {
  const sortRaw = one(sp.sort);
  const sort = (SORTS.some((s) => s.value === sortRaw) ? sortRaw : "featured") as Sort;
  const cat = one(sp.category);
  return {
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    category: cats.some((c) => c.slug === cat) ? cat : undefined,
    sizes: many(sp.size).filter((s) => f.sizes.includes(s)),
    colours: many(sp.colour).filter((c) => f.colours.some((x) => x.name === c)),
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sort,
    page: Math.max(1, Math.floor(num(one(sp.page)) ?? 1)),
  };
}

export function queryProducts(all: Product[], cats: Category[], q: ShopQuery) {
  const term = q.q?.toLowerCase();
  let list = all.filter((p) => {
    if (term && ![p.name, p.colour, p.description, categoryName(cats, p.category) ?? "", p.bn?.name ?? "", p.bn?.colour ?? "", cats.find((c) => c.slug === p.category)?.nameBn ?? ""].some((s) => s.toLowerCase().includes(term))) return false;
    if (q.category) {
      const g = GENDER_CATEGORY[q.category];
      if (g ? !(p.gender === g || p.gender === "unisex") : p.category !== q.category) return false;
    }
    if (q.sizes.length && !q.sizes.some((s) => (p.stock[s] ?? 0) > 0)) return false;
    if (q.colours.length && !q.colours.includes(p.colour)) return false;
    const price = priceOf(p);
    if (q.min !== undefined && price < q.min) return false;
    if (q.max !== undefined && price > q.max) return false;
    return true;
  });

  const by: Record<Sort, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(b.tags.length) - Number(a.tags.length) || b.popularity - a.popularity,
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    popular: (a, b) => b.popularity - a.popularity,
    "price-asc": (a, b) => priceOf(a) - priceOf(b),
    "price-desc": (a, b) => priceOf(b) - priceOf(a),
  };
  list = [...list].sort(by[q.sort]);

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  return { items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pages };
}
