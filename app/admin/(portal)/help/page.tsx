"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const emptyFaq = {
  category: "general",
  question: "",
  answer: "",
  sort_order: 0,
  is_published: true,
};

export default function AdminHelpPage() {
  const [tab, setTab] = useState<"faqs" | "contacts">("faqs");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFaq);
  const [selected, setSelected] = useState<Contact | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/help")
      .then((r) => r.json())
      .then((d) => {
        setFaqs(d.faqs ?? []);
        setContacts(d.contacts ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyFaq);
  };

  const startEdit = (f: Faq) => {
    setEditingId(f.id);
    setForm({
      category: f.category,
      question: f.question,
      answer: f.answer,
      sort_order: f.sortOrder,
      is_published: f.isPublished,
    });
  };

  const saveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/help", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...form } : form
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success(editingId ? "FAQ updated" : "FAQ created");
      resetForm();
      load();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const removeFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const res = await fetch(`/api/admin/help?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("FAQ deleted");
      if (editingId === id) resetForm();
      load();
    } else toast.error("Delete failed");
  };

  const setContactStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/help", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "contact", contactId: id, status }),
    });
    if (res.ok) {
      toast.success("Status updated");
      load();
      setSelected((s) => (s?.id === id ? { ...s, status } : s));
    } else toast.error("Update failed");
  };

  return (
    <AdminPageShell
      title="Help Center"
      subtitle="Manage FAQs and contact form messages"
    >
      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={tab === "faqs" ? "primary" : "outline"}
          onClick={() => setTab("faqs")}
        >
          FAQs
        </Button>
        <Button
          size="sm"
          variant={tab === "contacts" ? "primary" : "outline"}
          onClick={() => setTab("contacts")}
        >
          Contacts ({contacts.length})
        </Button>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={4} cols={4} />
      ) : tab === "faqs" ? (
        <div className="space-y-6">
          <form
            onSubmit={saveFaq}
            className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
          >
            <h2 className="font-semibold text-ink">
              {editingId ? "Edit FAQ" : "New FAQ"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
              <Input
                label="Sort order"
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <Input
              label="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
            <label className="block text-sm">
              <span className="mb-1 block text-ink-muted">Answer</span>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={3}
                required
                className="w-full rounded-xl border border-gray-200 p-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              Published
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {faqs.length === 0 ? (
              <p className="text-sm text-ink-muted">No FAQs yet.</p>
            ) : (
              faqs.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="gray">{f.category}</Badge>
                      <Badge tone={f.isPublished ? "green" : "gray"}>
                        {f.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="font-medium text-ink">{f.question}</p>
                    <p className="mt-1 text-sm text-ink-muted line-clamp-2">
                      {f.answer}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(f)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeFaq(f.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-ink-muted">No contact messages.</p>
            ) : (
              contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={`w-full rounded-2xl border p-4 text-left shadow-card transition-colors ${
                    selected?.id === c.id
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-gray-100 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-ink">{c.subject}</p>
                    <Badge tone={c.status === "new" ? "orange" : "gray"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {c.name} · {c.email}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {new Date(c.createdAt).toLocaleString("en-IN")}
                  </p>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div className="h-fit space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card xl:sticky xl:top-4">
              <h2 className="text-lg font-bold text-ink">{selected.subject}</h2>
              <p className="text-sm text-ink-muted whitespace-pre-wrap">
                {selected.message}
              </p>
              <div className="text-sm text-ink-soft">
                <p>{selected.name}</p>
                <p>{selected.email}</p>
                {selected.phone && <p>{selected.phone}</p>}
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-ink-soft">Status</span>
                <select
                  value={selected.status}
                  onChange={(e) => setContactStatus(selected.id, e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 px-2"
                >
                  {["new", "read", "replied", "closed"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
