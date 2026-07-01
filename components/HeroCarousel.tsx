"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Offer, ServiceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const serviceHref: Record<ServiceType | "all", string> = {
  all: "/",
  food: "/food",
  grocery: "/grocery",
  medicine: "/medicine",
  ecommerce: "/ecommerce",
};

export function HeroCarousel({ offers }: { offers: Offer[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const timer = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(timer);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {offers.map((offer) => (
            <div key={offer.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-48 w-full sm:h-72 md:h-80">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10">
                  <span className="w-fit rounded-full bg-brand-primary px-3 py-1 text-sm font-bold text-white">
                    {offer.discount}
                  </span>
                  <h2 className="max-w-md text-2xl font-extrabold text-white sm:text-4xl">
                    {offer.title}
                  </h2>
                  <p className="max-w-sm text-sm text-white/80 sm:text-base">
                    {offer.subtitle}
                  </p>
                  <Link
                    href={serviceHref[offer.service]}
                    className="w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-105"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white sm:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white sm:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {offers.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              selected === i ? "w-6 bg-white" : "w-2 bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
