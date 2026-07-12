"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bike,
  ChevronDown,
  Clock,
  HeartHandshake,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Pill,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const stats = [
  { label: "Orders Delivered", value: 2500000, suffix: "+" },
  { label: "Happy Customers", value: 850000, suffix: "+" },
  { label: "Partner Vendors", value: 12000, suffix: "+" },
  { label: "Cities", value: 45, suffix: "+" },
];

const values = [
  {
    title: "Customer First",
    desc: "Every decision starts with making ordering simpler, faster, and more reliable for the people who trust us daily.",
    icon: HeartHandshake,
  },
  {
    title: "Speed with Care",
    desc: "We obsess over delivery time without cutting corners on quality, safety, or partner fairness.",
    icon: Clock,
  },
  {
    title: "Local Strength",
    desc: "We grow with neighbourhood restaurants, kiranas, pharmacies, and riders who keep cities moving.",
    icon: Store,
  },
  {
    title: "Transparent Trust",
    desc: "Live tracking, secure payments, and clear support — so customers always know where their order stands.",
    icon: ShieldCheck,
  },
];

const services = [
  {
    title: "Food Delivery",
    desc: "Favourite restaurants and home-style meals, delivered hot.",
    href: "/food",
    icon: UtensilsCrossed,
  },
  {
    title: "Grocery",
    desc: "Daily essentials and fresh produce when you need them.",
    href: "/grocery",
    icon: ShoppingBag,
  },
  {
    title: "Medicine",
    desc: "Pharmacy orders with care, convenience, and reliability.",
    href: "/medicine",
    icon: Pill,
  },
  {
    title: "Shopping",
    desc: "Everyday products from trusted local and online sellers.",
    href: "/ecommerce",
    icon: Package,
  },
];

const steps = [
  {
    title: "Browse & Add",
    desc: "Explore food, grocery, medicine, and more in one app.",
    icon: Sparkles,
  },
  {
    title: "Checkout Securely",
    desc: "Pay with UPI, cards, netbanking, or cash on delivery.",
    icon: ShieldCheck,
  },
  {
    title: "Track Live",
    desc: "Follow your order from kitchen or store to your door.",
    icon: MapPin,
  },
  {
    title: "Enjoy Delivery",
    desc: "Receive your order fast — and rate your experience.",
    icon: Bike,
  },
];

const whyChoose = [
  "One app for food, grocery, medicine, and shopping",
  "Live order tracking with estimated delivery times",
  "Secure Razorpay payments and COD options",
  "Trusted local vendors and verified delivery partners",
  "Responsive customer support when you need help",
  "Transparent pricing with clear fees and offers",
];

const faqs = [
  {
    q: "What is Vantoo?",
    a: "Vantoo is an everyday super-app that brings food delivery, groceries, medicine, and shopping together with fast delivery, secure payments, and live tracking.",
  },
  {
    q: "Where does Vantoo operate?",
    a: "We currently serve multiple cities across India and continue expanding with local vendor and rider partners.",
  },
  {
    q: "How do I become a vendor or rider?",
    a: "Visit Sell on Vantoo or Deliver with Vantoo from our footer to start onboarding. Our partner teams will guide you through the next steps.",
  },
  {
    q: "How can I contact support?",
    a: "Use the Contact Us page, Help Center, or email support@vantoo.com. We typically respond within 24 hours.",
  },
];

const team = [
  { name: "Product & Engineering", role: "Building the platform customers rely on every day" },
  { name: "Operations", role: "Keeping deliveries fast, safe, and city-ready" },
  { name: "Partner Success", role: "Helping vendors and riders grow with Vantoo" },
  { name: "Customer Care", role: "Supporting every order with clarity and empathy" },
];

function formatStat(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative border-b border-orange-100 bg-gradient-to-br from-brand-surface via-white to-orange-50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-brand-primaryLight/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-in">
            <div className="mb-6">
              <Logo />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              About{" "}
              <span className="text-brand-primary">Vantoo</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Your everyday super-app for food, groceries, medicine, and shopping —
              delivered fast with secure payments and live order tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/">
                <Button size="lg">Start Ordering</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="secondary">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UtensilsCrossed, label: "Food", color: "bg-orange-100 text-brand-primary" },
                { icon: ShoppingBag, label: "Grocery", color: "bg-emerald-100 text-emerald-700" },
                { icon: Pill, label: "Medicine", color: "bg-sky-100 text-sky-700" },
                { icon: Truck, label: "Delivery", color: "bg-amber-100 text-amber-700" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-card backdrop-blur transition-transform duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Intro + Mission / Vision */}
      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Who We Are</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
            We connect customers with trusted local vendors and a reliable delivery
            network, making it effortless to get what you need, when you need it.
            From favourite restaurants to daily essentials and pharmacy orders,
            Vantoo brings everything together in one place.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-brand-surface to-white p-6 shadow-card sm:p-8">
            <h3 className="text-lg font-bold text-ink">Our Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              To power local commerce with technology that is fast, transparent, and
              fair — for customers, vendors, and delivery partners alike.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-card sm:p-8">
            <h3 className="text-lg font-bold text-ink">Our Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              To be the most trusted everyday commerce platform in every
              neighbourhood we serve — where convenience never comes at the cost of
              quality or community.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-surface/60 py-14 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Our Values</h2>
            <p className="mt-3 text-sm text-ink-muted">
              The principles that guide how we build, deliver, and support.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-surface text-brand-primary">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-ink">{v.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted sm:text-sm">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="container-page py-14 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Why Choose Vantoo
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              Built for everyday life — not just one category.
            </p>
            <ul className="mt-6 space-y-3">
              {whyChoose.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-brand-primary to-brand-primaryDark p-8 text-white shadow-cardHover">
            <Users className="h-10 w-10 text-white/90" />
            <h3 className="mt-4 text-xl font-bold">Built with partners</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Every successful delivery is a team effort — customers, vendors, and
              riders moving together. We invest in tools, support, and fair
              opportunity for the people who make Vantoo possible.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/vendor/onboarding">
                <Button variant="secondary" className="border-white bg-white text-brand-primary">
                  Sell on Vantoo
                </Button>
              </Link>
              <Link href="/rider/onboarding">
                <Button
                  variant="outline"
                  className="border-white/50 text-white hover:border-white hover:bg-white/10 hover:text-white"
                >
                  Deliver with Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-y border-orange-100 bg-white py-14 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Our Services</h2>
            <p className="mt-3 text-sm text-ink-muted">
              Everything you need, delivered through one trusted experience.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="group rounded-2xl border border-gray-100 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-cardHover"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-surface text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-xs text-ink-muted sm:text-sm">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            How Vantoo Works
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            From browse to doorstep in a few simple steps.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <span className="absolute right-4 top-4 text-3xl font-bold text-brand-surface">
                {i + 1}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-surface text-brand-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-xs text-ink-muted sm:text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ink py-14 text-white sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Vantoo in Numbers</h2>
            <p className="mt-3 text-sm text-white/70">
              Growing with customers, partners, and cities every day.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-brand-primaryLight sm:text-4xl">
                  <AnimatedCounter
                    value={stat.value}
                    format={(n) => `${formatStat(Math.round(n))}${stat.suffix}`}
                  />
                </p>
                <p className="mt-2 text-xs text-white/70 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Our Teams</h2>
          <p className="mt-3 text-sm text-ink-muted">
            Cross-functional teams working together to deliver everyday excellence.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-gray-100 bg-gradient-to-b from-brand-surface/80 to-white p-5 text-center shadow-card"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-ink">{t.name}</h3>
              <p className="mt-2 text-xs text-ink-muted">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-brand-surface/70 py-14 sm:py-16">
        <div className="container-page max-w-3xl text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand-primary" />
          <h2 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
            Trusted by Customers
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Secure payments powered by Razorpay, live tracking on every eligible
            order, and a support team ready to help — so you can order with
            confidence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-semibold text-ink-muted sm:text-sm">
            {["Secure Payments", "Live Tracking", "Verified Partners", "24h Support"].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-orange-200 bg-white px-4 py-2"
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="container-page py-14 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold text-ink">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-gray-50 px-5 pb-4 pt-3 text-sm leading-relaxed text-ink-muted">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-ink-muted">
            Need more answers?{" "}
            <Link href="/help/faqs" className="font-semibold text-brand-primary hover:underline">
              Browse all FAQs
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-orange-100 bg-gradient-to-br from-brand-surface to-white py-14 sm:py-16">
        <div className="container-page max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Ready to experience Vantoo?
          </h2>
          <p className="mt-3 text-sm text-ink-muted">
            Order in minutes, or reach out — we&apos;d love to hear from you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button size="lg">Order Now</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Contact Us
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline">
                Join Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
