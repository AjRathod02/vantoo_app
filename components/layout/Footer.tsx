import Link from "next/link";
import { Logo } from "@/components/Logo";

const columns = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press"],
  },
  {
    title: "Services",
    links: ["Food Delivery", "Grocery", "Medicine", "E-commerce"],
  },
  {
    title: "Support",
    links: ["Help Center", "Contact Us", "Terms", "Privacy Policy"],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-brand-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Your everyday super-app for food, groceries, medicine and shopping —
            delivered fast.
          </p>
          <div className="mt-4 flex gap-3">
            <span className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-ink-muted">
              Get it on Google Play
            </span>
            <span className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-ink-muted">
              Download on App Store
            </span>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-bold text-ink">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-ink-muted transition-colors hover:text-brand-primary"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 py-5">
        <p className="container-page text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} Vantoo. All rights reserved. Built as a UI
          demo.
        </p>
      </div>
    </footer>
  );
}
