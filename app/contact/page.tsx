"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";

const OFFICE = {
  name: "Vantoo Headquarters",
  line1: "12th Floor, Horizon Tech Park",
  line2: "Outer Ring Road, Bellandur",
  city: "Bengaluru, Karnataka 560103",
  mapEmbed:
    "https://maps.google.com/maps?q=Bellandur%20Bengaluru&t=&z=14&ie=UTF8&iwloc=&output=embed",
  mapLink: "https://maps.google.com/?q=Bellandur+Bengaluru",
};

const phones = [
  { label: "Customer Support", value: "+91 1800-123-8266" },
  { label: "Business Inquiries", value: "+91 80-4567-8900" },
];

const emails = [
  { label: "Support", value: "support@vantoo.com" },
  { label: "Business", value: "business@vantoo.com" },
  { label: "Careers", value: "careers@vantoo.com" },
];

const hours = [
  { day: "Monday – Saturday", time: "9:00 AM – 9:00 PM IST" },
  { day: "Sunday", time: "10:00 AM – 6:00 PM IST" },
  { day: "Order Support", time: "Available 24/7 in-app" },
];

const socials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "X (Twitter)", href: "https://x.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

export default function ContactPage() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const bodyMessage = fileName
        ? `${message}\n\n---\nAttachment noted: ${fileName}`
        : message;

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contact",
          name,
          email,
          phone,
          subject,
          message: bodyMessage,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
      toast.success("Message sent. We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setFileName("");
    } catch {
      toast.error("Could not send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-orange-100 bg-gradient-to-br from-brand-surface via-white to-orange-50">
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="container-page relative py-12 sm:py-16">
          <p className="text-sm font-semibold text-brand-primary">Get in touch</p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
            Questions, feedback, or business inquiries — our team is here to help.
            We typically respond within 24 hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#contact-form">
              <Button>Send a Message</Button>
            </a>
            <Link href="/help/faqs">
              <Button variant="secondary">Browse FAQs</Button>
            </Link>
            <a
              href="https://wa.me/9118001238266"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Live Chat (WhatsApp)
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-5 lg:py-16">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Building2 className="h-4 w-4 text-brand-primary" />
              Company Address
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {OFFICE.name}
              <br />
              {OFFICE.line1}
              <br />
              {OFFICE.line2}
              <br />
              {OFFICE.city}
            </p>
            <a
              href={OFFICE.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
            >
              <MapPin className="h-4 w-4" />
              Open in Maps
            </a>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Phone className="h-4 w-4 text-brand-primary" />
              Phone Numbers
            </h2>
            <ul className="mt-3 space-y-2">
              {phones.map((p) => (
                <li key={p.label} className="text-sm">
                  <span className="text-ink-muted">{p.label}</span>
                  <br />
                  <a
                    href={`tel:${p.value.replace(/\s/g, "")}`}
                    className="font-semibold text-ink hover:text-brand-primary"
                  >
                    {p.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Mail className="h-4 w-4 text-brand-primary" />
              Email Addresses
            </h2>
            <ul className="mt-3 space-y-2">
              {emails.map((e) => (
                <li key={e.label} className="text-sm">
                  <span className="text-ink-muted">{e.label}</span>
                  <br />
                  <a
                    href={`mailto:${e.value}`}
                    className="font-semibold text-ink hover:text-brand-primary"
                  >
                    {e.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Clock className="h-4 w-4 text-brand-primary" />
              Working Hours
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span className="text-ink-muted">{h.day}</span>
                  <span className="font-medium text-ink">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-ink">Social Media</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div
            id="contact-form"
            className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8"
          >
            <h2 className="text-lg font-bold text-ink">Send us a message</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Fill in the form and our support team will get back to you.
            </p>

            {success && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Message sent successfully</p>
                  <p className="mt-1 text-green-700">
                    Thanks for reaching out. We&apos;ll respond within 24 hours
                    on business days.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Subject"
                placeholder="How can we help?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={3}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  placeholder="Tell us more about your request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  File Attachment{" "}
                  <span className="font-normal text-ink-soft">(Optional)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-brand-surface/40 px-4 py-3 text-sm text-ink-muted transition-colors hover:border-brand-primary">
                  <Upload className="h-4 w-4 text-brand-primary" />
                  <span className="truncate">
                    {fileName || "Choose a file (PDF, PNG, JPG — max 5MB)"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setFileName("");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File must be under 5MB");
                        e.target.value = "";
                        return;
                      }
                      setFileName(file.name);
                    }}
                  />
                </label>
              </div>
              <Button type="submit" fullWidth disabled={loading} size="lg">
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-brand-surface to-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Headphones className="h-5 w-5 text-brand-primary" />
              Customer Support
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              For order issues, refunds, or delivery help, use Help Center tickets
              for faster tracking — or message us here anytime.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/help">
                <Button variant="secondary">Help Center</Button>
              </Link>
              <Link href="/help/faqs">
                <Button variant="outline">FAQ Shortcut</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-ink">Business Inquiries</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Interested in partnerships, enterprise catering, or city expansion?
              Email{" "}
              <a
                href="mailto:business@vantoo.com"
                className="font-semibold text-brand-primary hover:underline"
              >
                business@vantoo.com
              </a>{" "}
              or call our business desk. Vendors and riders can also start
              onboarding online.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/vendor/onboarding">
                <Button variant="outline" size="sm">
                  Become a Vendor
                </Button>
              </Link>
              <Link href="/rider/onboarding">
                <Button variant="outline" size="sm">
                  Become a Rider
                </Button>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
            <div className="border-b border-gray-100 bg-white px-5 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <MapPin className="h-4 w-4 text-brand-primary" />
                Office Location
              </h2>
            </div>
            <iframe
              title="Vantoo office map"
              src={OFFICE.mapEmbed}
              className="h-64 w-full border-0 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
