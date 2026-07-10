"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChartCard } from "@/components/admin/ChartCard";
import type { ChartDataPoint } from "@/lib/admin/types";

const REPORT_TYPES = [
  { id: "revenue", label: "Revenue" },
  { id: "orders", label: "Orders" },
  { id: "refunds", label: "Refunds" },
  { id: "cancellations", label: "Cancellations" },
  { id: "products", label: "Product Sales" },
  { id: "delivery", label: "Delivery Performance" },
  { id: "geographic", label: "Geographic Sales" },
];

export default function AdminReportsPage() {
  const [type, setType] = useState("revenue");
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports?type=${type}&period=weekly`)
      .then((r) => r.json())
      .then((d) => setReport(d.report))
      .finally(() => setLoading(false));
  }, [type]);

  const chart = (report?.chart as ChartDataPoint[]) ?? [];

  return (
    <>
      <AdminHeader title="Reports & Analytics" subtitle="Generate and export business reports" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setType(r.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                type === r.id
                  ? "bg-brand-primary text-white"
                  : "border border-gray-200 bg-white text-ink-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-ink-muted">Loading report...</p>
        ) : report ? (
          <div className="space-y-4">
            {chart.length > 0 && (
              <ChartCard
                title={`${type.charAt(0).toUpperCase() + type.slice(1)} Trend`}
                data={chart}
                valuePrefix={type === "revenue" ? "₹" : ""}
              />
            )}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="mb-3 font-semibold text-ink">Report Data</h3>
              <pre className="max-h-96 overflow-auto rounded-xl bg-gray-50 p-4 text-xs text-ink-muted">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-primary"
                onClick={() => toastExport("CSV")}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-primary"
                onClick={() => toastExport("Excel")}
              >
                Export Excel
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-primary"
                onClick={() => toastExport("PDF")}
              >
                Export PDF
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function toastExport(format: string) {
  alert(`Export to ${format} — connect to report generation service in production.`);
}
