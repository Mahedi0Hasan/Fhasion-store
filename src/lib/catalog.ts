/**
 * Demo catalogue used by the storefront until Phase 4 moves products into
 * Supabase. Shapes mirror the planned `products` / `product_variants` tables
 * so components won't change when the data source does.
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
  colour: string;
  priceBDT: number;
  salePriceBDT?: number;
  images: ProductImage[];
  sizes: string[];
  tags: ("new" | "bestseller")[];
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    slug: "cloud-cashmere-cardigan-ivory",
    name: "Cloud Cashmere Cardigan",
    category: "womens-fashion",
    colour: "Ivory",
    priceBDT: 14500,
    images: [{ src: "/images/products/cashmere-cardigan.webp", alt: "Ivory cashmere cardigan", fit: "contain" }],
    sizes: ["XS", "S", "M", "L"],
    tags: ["new"],
  },
  {
    id: "p2",
    slug: "pleated-column-dress-sienna",
    name: "Pleated Column Dress",
    category: "dresses",
    colour: "Sienna",
    priceBDT: 16800,
    images: [{ src: "/images/products/pleated-collection.webp", alt: "Pleated column dresses in sienna tones", fit: "contain" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["new"],
  },
  {
    id: "p3",
    slug: "knit-block-pump-sand",
    name: "Knit Block Pump",
    category: "shoes",
    colour: "Sand",
    priceBDT: 7900,
    salePriceBDT: 6900,
    images: [{ src: "/images/products/knit-pumps.webp", alt: "Sand knit block-heel pumps", fit: "contain" }],
    sizes: ["36", "37", "38", "39", "40"],
    tags: ["new"],
  },
  {
    id: "p4",
    slug: "brushed-crew-sweater-heather",
    name: "Brushed Crew Sweater",
    category: "mens-fashion",
    colour: "Heather Grey",
    priceBDT: 5900,
    images: [{ src: "/images/products/crew-sweater.webp", alt: "Heather grey crew sweater", fit: "contain" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    tags: ["bestseller"],
  },
  {
    id: "p5",
    slug: "heritage-trench-coat-stone",
    name: "Heritage Trench Coat",
    category: "jackets",
    colour: "Stone",
    priceBDT: 22500,
    images: [{ src: "/images/editorial/trench-chair.webp", alt: "Stone trench coat draped over a chair", fit: "cover" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["bestseller"],
  },
  {
    id: "p6",
    slug: "wide-leg-wool-trouser-oat",
    name: "Wide-Leg Wool Trouser",
    category: "pants",
    colour: "Oat",
    priceBDT: 8900,
    images: [{ src: "/images/editorial/beige-tailoring.webp", alt: "Oat wide-leg trousers with long coat", fit: "cover", position: "50% 70%" }],
    sizes: ["XS", "S", "M", "L"],
    tags: ["new"],
  },
  {
    id: "p7",
    slug: "pleated-maxi-dress-sand",
    name: "Pleated Maxi Dress",
    category: "dresses",
    colour: "Sand",
    priceBDT: 17200,
    salePriceBDT: 14900,
    images: [{ src: "/images/editorial/pleated-dunes.webp", alt: "Sand pleated maxi dress on a stone plinth", fit: "cover", position: "55% 40%" }],
    sizes: ["XS", "S", "M", "L"],
    tags: ["bestseller"],
  },
  {
    id: "p8",
    slug: "linen-suit-set-flax",
    name: "Linen Suit Set",
    category: "womens-fashion",
    colour: "Flax",
    priceBDT: 19500,
    images: [{ src: "/images/editorial/linen-duo.webp", alt: "Flax linen suit and linen skirt set", fit: "cover", position: "30% 40%" }],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["bestseller"],
  },
];

export const byTag = (tag: Product["tags"][number]) => PRODUCTS.filter((p) => p.tags.includes(tag));

export function formatBDT(amount: number) {
  return `৳ ${new Intl.NumberFormat("en-IN").format(amount)}`;
}
