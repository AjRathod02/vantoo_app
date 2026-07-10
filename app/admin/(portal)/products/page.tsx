"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "@/lib/stores/toast";

const emptyProduct: Product = {
  id: "",
  name: "",
  description: "",
  service: "food",
  category: "",
  brand: "",
  price: 0,
  originalPrice: undefined,
  rating: 4,
  reviews: 0,
  image: "",
  vendorId: "",
  unit: "",
  inStock: true,
};

const UNITS = ["piece", "kg", "g", "L", "ml", "pack", "dozen", "box"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-ink">{children}</span>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleImageFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result as string }));
      toast.success("Image added");
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.id || !form.name) {
      toast.error("Product ID and name are required");
      return;
    }
    if (!form.image) {
      toast.error("Add a product image (upload or URL)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vendorId: form.vendorId || undefined,
          unit: form.unit || undefined,
          originalPrice: form.originalPrice || undefined,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save product");
        return;
      }
      toast.success("Product saved");
      setForm(emptyProduct);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Product deleted");
    load();
  };

  const discount =
    form.originalPrice && form.originalPrice > form.price
      ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
      : 0;

  return (
    <AdminPageShell
      title="Products"
      subtitle="Add products with images, pricing, inventory, and catalog details"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="mb-5 text-base font-semibold text-ink">Add / Update Product</h2>

          <div className="mb-6 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div>
              <FieldLabel>Product Image</FieldLabel>
              <div className="relative flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                {form.image ? (
                  <>
                    {form.image.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={form.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1 shadow"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4 text-ink-muted" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <ImagePlus className="h-8 w-8 text-ink-soft" />
                    <p className="text-xs text-ink-muted">Upload or paste URL</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="mt-3 w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
              />
              <Input
                className="mt-3"
                placeholder="Or paste image URL"
                value={form.image.startsWith("data:") ? "" : form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Product ID"
                placeholder="e.g. p-food-101"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
              <Input
                label="Product Name"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Brand"
                placeholder="Brand name"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Category"
                placeholder="e.g. Snacks, Dairy"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <div>
                <FieldLabel>Service</FieldLabel>
                <select
                  className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm"
                  value={form.service}
                  onChange={(e) =>
                    setForm({ ...form, service: e.target.value as Product["service"] })
                  }
                >
                  <option value="food">Food</option>
                  <option value="grocery">Grocery</option>
                  <option value="medicine">Medicine</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>
              <div>
                <FieldLabel>Unit</FieldLabel>
                <select
                  className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm"
                  value={form.unit ?? ""}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="">Select unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Selling Price (₹)"
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
              <Input
                label="Original Price / MRP (₹)"
                type="number"
                min={0}
                placeholder="Optional — for discount display"
                value={form.originalPrice ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    originalPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <Input
                label="Vendor ID"
                placeholder="Optional vendor reference"
                value={form.vendorId ?? ""}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              />
              <Input
                label="Rating (1–5)"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              />
              <Input
                label="Review Count"
                type="number"
                min={0}
                value={form.reviews}
                onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })}
              />
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="font-medium text-ink">In stock</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              rows={3}
              placeholder="Product description, ingredients, highlights..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {discount > 0 && (
            <p className="mb-4 text-sm text-brand-accent">
              {discount}% discount off MRP ({formatINR(form.originalPrice!)} → {formatINR(form.price)})
            </p>
          )}

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Product"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(emptyProduct);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Clear Form
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-ink-muted">
              <tr>
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Service</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-ink-muted" colSpan={7}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="p-4 text-ink-muted" colSpan={7}>
                    No products yet. Add your first product above.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                        {p.image ? (
                          p.image.startsWith("data:") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Image src={p.image} alt="" fill className="object-cover" unoptimized />
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-ink-soft">
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.brand}</p>
                    </td>
                    <td className="p-4 capitalize">{p.service}</td>
                    <td className="p-4 text-ink-muted">{p.category || "—"}</td>
                    <td className="p-4">
                      <p>{formatINR(p.price)}</p>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <p className="text-xs text-ink-soft line-through">
                          {formatINR(p.originalPrice)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          p.inStock
                            ? "text-brand-accent font-medium"
                            : "text-brand-secondary font-medium"
                        }
                      >
                        {p.inStock ? "In stock" : "Out of stock"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        className="mr-3 font-medium text-brand-primary hover:underline"
                        onClick={() => setForm(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="font-medium text-brand-secondary hover:underline"
                        onClick={() => remove(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
