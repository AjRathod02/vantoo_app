import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { products as seedProducts } from "@/lib/data/products";
import { getProduct, listProducts } from "@/lib/server/products";
import { formatINR } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";

const serviceLabel: Record<string, string> = {
  food: "Food",
  grocery: "Grocery",
  medicine: "Medicine",
  ecommerce: "E-commerce",
  local_shop: "Local Shop",
};

export function generateStaticParams() {
  return seedProducts.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const allRelated = await listProducts({ service: product.service });
  const related = allRelated.filter((p) => p.id !== product.id).slice(0, 4);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  return (
    <div className="container-page py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-primary">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/${product.service}`} className="hover:text-brand-primary capitalize">
          {serviceLabel[product.service] ?? product.service}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {discount > 0 && (
            <Badge tone="red" className="absolute left-4 top-4">
              {discount}% OFF
            </Badge>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-primary">{product.brand}</p>
            <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Rating value={product.rating} />
              <span className="text-sm text-ink-muted">({product.reviews} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-ink">{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-ink-muted line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
            {product.unit && (
              <span className="text-sm text-ink-muted">/ {product.unit}</span>
            )}
          </div>

          <AvailabilityBadge inStock={product.inStock} />

          <p className="text-ink-muted">{product.description}</p>

          <ProductActions product={product} />

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-gray-100 p-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-medium text-ink">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <ShieldCheck className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-medium text-ink">Quality Assured</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-medium text-ink">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="You may also like" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
