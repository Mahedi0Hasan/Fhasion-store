import { Hero } from "@/components/home/hero";
import { BrandStory, FeaturedCollections, Lookbook, ProductRail, PromoBanner } from "@/components/home/sections";
import { Newsletter } from "@/components/home/newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCollections />
      <ProductRail tag="new" />
      <PromoBanner />
      <ProductRail tag="bestseller" />
      <BrandStory />
      <Lookbook />
      <Newsletter />
    </>
  );
}
