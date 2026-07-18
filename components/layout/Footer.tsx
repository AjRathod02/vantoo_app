"use client";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/contact" },
  { label: "Blog", href: "/blog" },
];

const supportLinks = [
  { label: "Help Center", href: "/help" },
  { label: "FAQs", href: "/help/faqs" },
  { label: "Track Order", href: "/orders" },
  { label: "Refund Policy", href: "/policies/refund" },
  { label: "Cancellation Policy", href: "/policies/cancellation" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
  { label: "Cookie Policy", href: "/policies/cookies" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    icon: Twitter,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: Youtube,
  },
];

const contactInfo = {
  email: "support@vantoo.com",
  phone: "+91 1800-123-8266",
  address: [
    "12th Floor, Horizon Tech Park",
    "Outer Ring Road, Bellandur",
    "Bengaluru, Karnataka 560103",
  ],
};

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-brand-surface">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:gap-8 sm:py-12 md:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Your everyday super-app for food, groceries, medicine and shopping —
            delivered fast with secure payments and live order tracking.
          </p>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-bold text-ink">Contact Information</h4>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-brand-primary"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              {contactInfo.email}
            </a>
            <a
              href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
              className="flex items-start gap-2 text-sm text-ink-muted transition-colors hover:text-brand-primary"
            >
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              {contactInfo.phone}
            </a>
            <p className="flex items-start gap-2 text-sm text-ink-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {contactInfo.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold text-ink">Company</h4>
          <ul className="space-y-2">
            {companyLinks.map((link) => (
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

        <div>
          <h4 className="mb-3 text-sm font-bold text-ink">Customer Support</h4>
          <ul className="space-y-2">
            {supportLinks.map((link) => (
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

        <div>
          <h4 className="mb-3 text-sm font-bold text-ink">Legal</h4>
          <ul className="space-y-2">
            {legalLinks.map((link) => (
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

        <div className="col-span-2 sm:col-span-1">
          <h4 className="mb-3 text-sm font-bold text-ink">Social Media</h4>
          <ul className="space-y-2">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-brand-primary"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <h4 className="mb-3 mt-8 text-sm font-bold text-ink">App Download</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-muted transition-colors hover:text-brand-primary"
              >
                Google Play
              </a>
            </li>
            <li>
              <span className="text-sm text-ink-soft">
                Apple App Store{" "}
                <span className="text-xs">(Coming Soon)</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-5">
        <p className="container-page text-center text-xs text-ink-soft">
          Copyright © {new Date().getFullYear()} Vantoo. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
