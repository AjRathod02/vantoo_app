import { offers } from "@/lib/data/offers";
import { restaurants } from "@/lib/data/restaurants";
import { products } from "@/lib/data/products";
import { categories } from "@/lib/data/categories";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ServiceGrid } from "@/components/ServiceGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { RestaurantCard } from "@/components/RestaurantCard";
import { ProductCard } from "@/components/ProductCard";
import { CategoryStrip } from "@/components/CategoryStrip";
import { OfferStrip } from "@/components/OfferStrip";

export default function HomePage() {
  const topRestaurants = restaurants.slice(0, 8);
  const popularProducts = products
    .filter((p) => p.service === "food")
    .slice(0, 4);
  const trending = products.filter((p) => p.service === "ecommerce").slice(0, 4);
  const foodCategories = categories.filter((c) => c.service === "food");

  return (
    <div className="container-page space-y-10 py-6">
      <HeroCarousel offers={offers} />

      <section>
        <SectionHeader title="What can we get you?" subtitle="Pick a service to get started" />
        <ServiceGrid />
      </section>

      <section>
        <SectionHeader title="Top Categories" />
        <CategoryStrip categories={foodCategories} />
      </section>

      <section>
        <SectionHeader title="Best Offers" subtitle="Deals you don't want to miss" />
        <OfferStrip offers={offers} />
      </section>

      <section>
        <SectionHeader title="Top Restaurants Near You" href="/food" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {topRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Popular Near You" href="/food" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {popularProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Trending Products" href="/ecommerce" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
