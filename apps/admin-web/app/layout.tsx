import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vantoo Admin",
  description: "Platform administration portal",
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vendors", label: "Vendors" },
  { href: "/riders", label: "Riders" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
];

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-brand-primary">Vantoo Admin</span>
              <nav className="hidden gap-4 sm:flex">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-gray-600 hover:text-brand-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <a
              href="http://localhost:3000"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:border-brand-primary"
            >
              Customer Site
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
