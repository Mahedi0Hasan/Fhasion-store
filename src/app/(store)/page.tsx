import { Hero } from "@/components/home/hero";
import { BrandStory, FeaturedCollections, Lookbook, ProductRail, PromoBanner } from "@/components/home/sections";
import { Newsletter } from "@/components/home/newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCollections />
      <ProductRail tag="new" eyebrow="Just landed" title="New arrivals" />
      <PromoBanner />
      <ProductRail tag="bestseller" eyebrow="Most loved" title="Best sellers" />
      <BrandStory />
      <Lookbook />
      <Newsletter />
    </>
  );
}
