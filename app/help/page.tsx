"use client";

import Link from "next/link";
import {
  BookOpen,
  FileWarning,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Star,
} from "lucide-react";

const links = [
  {
    href: "/help/faqs",
    title: "FAQs",
    desc: "Quick answers about orders, payments, refunds, and more",
    icon: HelpCircle,
  },
  {
    href: "/contact",
    title: "Contact Us",
    desc: "Send a message to our support team",
    icon: MessageSquare,
  },
  {
    href: "/help/complaint",
    title: "Raise a Complaint",
    desc: "Report order, delivery, payment, or product issues",
    icon: FileWarning,
  },
  {
    href: "/help/complaints",
    title: "My Complaints",
    desc: "Track complaint status and reply to support",
    icon: LifeBuoy,
  },
  {
    href: "/help/request",
    title: "Support Request",
    desc: "Create a help ticket when FAQs are not enough",
    icon: BookOpen,
  },
  {
    href: "/rate-app",
    title: "Rate Our App",
    desc: "Share feedback and help us improve Vantoo",
    icon: Star,
  },
];

const categories = [
  "Product Help",
  "Product Information",
  "Returns",
  "Product Issues",
  "Damaged Products",
  "Account",
  "Orders",
  "Payments",
  "Refunds",
  "Delivery",
  "Wallet",
  "Coupons",
  "Technical Support",
];

export default function HelpCenterPage() {
  return (
    <div className="container-page max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Help Center</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Find answers, contact support, or raise a complaint. Every request gets
          a unique tracking ID.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-surface text-brand-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{desc}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">Browse by topic</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/help/faqs?category=${encodeURIComponent(c.toLowerCase().split(" ")[0]!)}`}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink-muted hover:border-brand-primary hover:text-brand-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
