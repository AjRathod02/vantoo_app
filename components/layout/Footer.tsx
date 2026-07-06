"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Sell on Vantoo", href: "/vendor/onboarding" },
      { label: "Deliver with Vantoo", href: "/rider/onboarding" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Food Delivery", href: "/food" },
      { label: "Grocery", href: "/grocery" },
      { label: "Medicine", href: "/medicine" },
      { label: "E-commerce", href: "/ecommerce" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Terms", href: "/policies/terms" },
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Refund Policy", href: "/policies/refund" },
      { label: "Cancellation Policy", href: "/policies/cancellation" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-16 border-t border-gray-100 bg-brand-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Your everyday super-app for food, groceries, medicine and shopping —
            delivered fast with secure payments and live order tracking.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-bold text-ink">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-brand-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 py-5">
        <p className="container-page text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} Vantoo. All rights reserved. Payments
          secured by Razorpay.
        </p>
      </div>
    </footer>
  );
}
