"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

function FaqsInner() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const url = category
      ? `/api/support?view=faqs&category=${encodeURIComponent(category)}`
      : "/api/support?view=faqs";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []));
  }, [category]);

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <div>
        <Link href="/help" className="text-sm text-brand-primary">
          ← Help Center
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-ink">FAQs</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Can&apos;t find an answer?{" "}
          <Link href="/help/request" className="font-semibold text-brand-primary">
            Create a support request
          </Link>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
        {faqs.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">No FAQs found for this topic.</p>
        ) : (
          faqs.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOpen(open === f.id ? null : f.id)}
              className="w-full border-b border-gray-100 px-5 py-4 text-left last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">
                    {f.category}
                  </p>
                  <p className="mt-1 font-medium text-ink">{f.question}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-ink-soft transition ${
                    open === f.id ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open === f.id && (
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {f.answer}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      <Link href="/help/request">
        <Button>Still need help?</Button>
      </Link>
    </div>
  );
}

export default function FaqsPage() {
  return (
    <Suspense fallback={<div className="container-page py-8">Loading FAQs...</div>}>
      <FaqsInner />
    </Suspense>
  );
}
