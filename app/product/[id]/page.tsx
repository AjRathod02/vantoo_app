import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { products } from "@/lib/data/products";
import { formatINR } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { ProductActions } from "@/components/ProductActions";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";

const serviceLabel: Record<string, string> = {
  food: "Food",
  grocery: "Grocery",
  medicine: "Medicine",
  ecommerce: "E-commerce",
};

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) notFound();

  const related = products
    .filter((p) => p.service === product.service && p.id !== product.id)
    .slice(0, 4);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  return (
    <div className="container-page py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-ink-muted">
        <Link href={`/${product.service}`} className="hover:text-brand-primary">
          {serviceLabel[product.service]}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-100 bg-gray-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          {discount > 0 && (
            <span className="absolute left-4 top-4 rounded-lg bg-brand-secondary px-3 py-1 text-sm font-bold text-white">
              {discount}% OFF
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Badge tone="gray">{product.brand}</Badge>
            <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <Rating value={product.rating} reviews={product.reviews} />
              {product.unit && (
                <span className="text-sm text-ink-muted">· {product.unit}</span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-extrabold text-ink">
              {formatINR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="mb-1 text-lg text-ink-soft line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <span className="mb-1 text-sm font-bold text-brand-accent">
                Save {discount}%
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-ink-muted">
            {product.description}
          </p>

          <ProductActions product={product} />

          <div className="mt-2 grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 p-4">
            <Feature icon={<Truck className="h-5 w-5" />} label="Fast Delivery" />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Secure Payment"
            />
            <Feature
              icon={<RotateCcw className="h-5 w-5" />}
              label="Easy Returns"
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="You may also like" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-brand-primary">{icon}</span>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
    </div>
  );
}
