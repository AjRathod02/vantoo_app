"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import type { SavedPaymentMethod } from "@/lib/payments/saved-methods";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [type, setType] = useState<"upi" | "card">("upi");
  const [label, setLabel] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardNetwork, setCardNetwork] = useState("Visa");
  const [cardExpiry, setCardExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () =>
    fetch("/api/payments/saved")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods ?? []));

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?redirect=/profile/payments");
      return;
    }
    load();
  }, [hydrated, user, router]);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          label: label || (type === "upi" ? "My UPI" : "My Card"),
          upiId: type === "upi" ? upiId : undefined,
          cardLast4: type === "card" ? cardLast4 : undefined,
          cardNetwork: type === "card" ? cardNetwork : undefined,
          cardExpiry: type === "card" ? cardExpiry : undefined,
          razorpayTokenId:
            type === "card" ? `tok_demo_${cardLast4 || "0000"}` : undefined,
          isDefault: methods.length === 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Payment method saved");
      setLabel("");
      setUpiId("");
      setCardLast4("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/payments/saved?id=${id}`, { method: "DELETE" });
    toast.success("Removed");
    load();
  };

  const setDefault = async (id: string) => {
    await fetch("/api/payments/saved", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDefault: true }),
    });
    toast.success("Default updated");
    load();
  };

  if (!hydrated || !user) return null;

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-ink">Saved Payment Methods</h1>
      <p className="text-sm text-ink-muted">
        Cards are stored with secure tokenization only — we never save full card
        numbers or CVV.
      </p>

      <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
        {methods.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">
            No saved methods yet.
          </p>
        ) : (
          methods.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i !== 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <CreditCard className="h-5 w-5 text-brand-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  {m.label}{" "}
                  {m.isDefault && <Badge tone="green">Default</Badge>}
                </p>
                <p className="text-xs text-ink-soft">
                  {m.type === "upi"
                    ? m.upiId
                    : `${m.cardNetwork} •••• ${m.cardLast4}`}
                </p>
              </div>
              {!m.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(m.id)}
                  className="text-xs font-semibold text-brand-primary"
                >
                  Set default
                </button>
              )}
              <button type="button" onClick={() => remove(m.id)} aria-label="Remove">
                <Trash2 className="h-4 w-4 text-ink-soft" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">Add method</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("upi")}
            className={`rounded-xl px-3 py-2 text-sm ${
              type === "upi" ? "bg-brand-primary text-white" : "bg-gray-100"
            }`}
          >
            UPI
          </button>
          <button
            type="button"
            onClick={() => setType("card")}
            className={`rounded-xl px-3 py-2 text-sm ${
              type === "card" ? "bg-brand-primary text-white" : "bg-gray-100"
            }`}
          >
            Card
          </button>
        </div>
        <Input
          placeholder="Nickname"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        {type === "upi" ? (
          <Input
            placeholder="name@upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
        ) : (
          <>
            <Input
              placeholder="Last 4 digits"
              maxLength={4}
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              placeholder="Network (Visa / Mastercard)"
              value={cardNetwork}
              onChange={(e) => setCardNetwork(e.target.value)}
            />
            <Input
              placeholder="Expiry MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
            />
          </>
        )}
        <Button onClick={save} disabled={loading} fullWidth>
          {loading ? "Saving..." : "Save Payment Method"}
        </Button>
      </div>
    </div>
  );
}
