"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";

const emptyProduct: Product = {
  id: "",
  name: "",
  description: "",
  service: "food",
  category: "",
  brand: "",
  price: 0,
  rating: 4,
  reviews: 0,
  image: "",
  inStock: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.id || !form.name) {
      toast.error("Product ID and name are required");
      return;
    }
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Failed to save product");
      return;
    }
    toast.success("Product saved");
    setForm(emptyProduct);
    load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Product deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Products</h1>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 font-semibold text-ink">Add / Update Product</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="ID (e.g. p-f11)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Price" type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <select
            className="h-11 rounded-xl border border-gray-300 px-3 text-sm"
            value={form.service}
            onChange={(e) => setForm({ ...form, service: e.target.value as Product["service"] })}
          >
            <option value="food">Food</option>
            <option value="grocery">Grocery</option>
            <option value="medicine">Medicine</option>
            <option value="ecommerce">E-commerce</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
            In stock
          </label>
        </div>
        <textarea
          className="mt-3 w-full rounded-xl border border-gray-300 p-3 text-sm"
          rows={2}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button className="mt-3" onClick={save}>Save Product</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-ink-muted">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Service</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={5}>Loading...</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 capitalize">{p.service}</td>
                  <td className="p-3">{formatINR(p.price)}</td>
                  <td className="p-3">{p.inStock ? "Available" : "Out of stock"}</td>
                  <td className="p-3">
                    <button className="mr-3 text-brand-primary" onClick={() => setForm(p)}>Edit</button>
                    <button className="text-brand-secondary" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
