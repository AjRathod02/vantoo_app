"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceType: "food",
    basePrice: "",
    categoryName: "",
    brandName: "",
    imageUrl: "",
    initialStock: "10",
    publish: true,
  });

  function load() {
    fetch("/api/vendor/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/vendor/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        basePrice: Number(form.basePrice),
        initialStock: Number(form.initialStock),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowForm(false);
      load();
    }
  }

  if (loading) return <p className="text-ink-muted">Loading products...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Products</h1>
          <p className="text-sm text-ink-muted">Manage your catalog and inventory.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:grid-cols-2">
          <Input label="Product Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Price (₹)" type="number" required value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
          <Input label="Category" value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
          <Input label="Brand" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
          <div>
            <label className="text-sm font-medium text-ink">Service</label>
            <select className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
              <option value="food">Food</option>
              <option value="grocery">Grocery</option>
              <option value="medicine">Medicine</option>
              <option value="ecommerce">E-commerce</option>
            </select>
          </div>
          <Input label="Initial Stock" type="number" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} />
          <Input label="Image URL" className="sm:col-span-2" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <Input label="Description" className="sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create & Publish"}</Button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-ink-muted">No products yet. Add your first product to start selling.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-ink-muted">Product</th>
                <th className="px-4 py-3 font-medium text-ink-muted">Price</th>
                <th className="px-4 py-3 font-medium text-ink-muted">Stock</th>
                <th className="px-4 py-3 font-medium text-ink-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3">{formatINR(p.price)}</td>
                  <td className="px-4 py-3">{p.inStock ? "In stock" : "Out of stock"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.inStock ? "green" : "gray"}>{p.inStock ? "Active" : "Draft"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
