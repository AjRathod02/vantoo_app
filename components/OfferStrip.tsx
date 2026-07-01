import Link from "next/link";
import type { Offer, ServiceType } from "@/lib/types";

const colorMap = {
  orange: "from-brand-primary to-brand-primaryLight",
  red: "from-brand-secondary to-rose-400",
  green: "from-brand-accent to-emerald-400",
};

const serviceHref: Record<ServiceType | "all", string> = {
  all: "/",
  food: "/food",
  grocery: "/grocery",
  medicine: "/medicine",
  ecommerce: "/ecommerce",
};

export function OfferStrip({ offers }: { offers: Offer[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {offers.map((offer) => (
        <Link
          key={offer.id}
          href={serviceHref[offer.service]}
          className={`flex flex-col justify-between gap-2 rounded-2xl bg-gradient-to-br ${colorMap[offer.color]} p-5 text-white shadow-card transition-transform hover:-translate-y-1`}
        >
          <span className="text-2xl font-extrabold">{offer.discount}</span>
          <div>
            <p className="text-sm font-bold">{offer.title}</p>
            <p className="text-xs text-white/80">{offer.subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
