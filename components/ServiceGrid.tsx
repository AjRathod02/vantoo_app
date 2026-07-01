import Link from "next/link";
import { UtensilsCrossed, ShoppingBasket, Pill, Store } from "lucide-react";

const services = [
  {
    href: "/food",
    label: "Food",
    desc: "Restaurants & meals",
    icon: UtensilsCrossed,
    className: "from-brand-primary to-brand-primaryLight",
  },
  {
    href: "/grocery",
    label: "Grocery",
    desc: "Fresh & daily needs",
    icon: ShoppingBasket,
    className: "from-brand-accent to-emerald-400",
  },
  {
    href: "/medicine",
    label: "Medicine",
    desc: "Pharmacy near you",
    icon: Pill,
    className: "from-brand-secondary to-rose-400",
  },
  {
    href: "/ecommerce",
    label: "E-commerce",
    desc: "Shop everything",
    icon: Store,
    className: "from-violet-500 to-indigo-400",
  },
];

export function ServiceGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {services.map(({ href, label, desc, icon: Icon, className }) => (
        <Link
          key={href}
          href={href}
          className={`group flex flex-col gap-2 rounded-2xl bg-gradient-to-br ${className} p-5 text-white shadow-card transition-transform hover:-translate-y-1`}
        >
          <Icon className="h-8 w-8" />
          <div>
            <p className="text-lg font-bold">{label}</p>
            <p className="text-xs text-white/80">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
