"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    const url = q ? `/api/admin/customers?search=${encodeURIComponent(q)}` : "/api/admin/customers";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const suspend = async (id: string) => {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "suspended" }),
    });
    if (res.ok) {
      toast.success("Customer updated");
      load(search);
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <>
      <AdminHeader title="Customers" subtitle="Manage customer accounts" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand-primary focus:outline-none"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {loading ? (
          <p className="text-ink-muted">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="text-ink-muted">No customers found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{c.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => suspend(c.id)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
