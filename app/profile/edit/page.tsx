"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";

export default function ProfileEditPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const syncSession = useAuthStore((s) => s.syncSession);
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [changeCount, setChangeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?redirect=/profile/edit");
      return;
    }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.profile?.name ?? user.name);
        setPhone(d.profile?.phone ?? user.phone);
        setDateOfBirth(d.profile?.dateOfBirth ?? "");
        setChangeCount(d.profile?.dobChangeCount ?? 0);
      });
  }, [hydrated, user, router]);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          dateOfBirth: dateOfBirth || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await syncSession();
      toast.success("Profile updated");
      router.push("/profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || !user) return null;

  return (
    <div className="container-page max-w-md space-y-6 py-8">
      <h1 className="text-2xl font-bold text-ink">Edit Profile</h1>
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        <div>
          <label className="mb-1 block text-xs text-ink-muted">
            Date of birth {changeCount > 0 ? `(${changeCount}/2 changes used)` : ""}
          </label>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            disabled={changeCount >= 2 && Boolean(dateOfBirth)}
          />
          <p className="mt-1 text-xs text-ink-soft">
            Used for birthday wishes and special offers. Limited edits to prevent abuse.
          </p>
        </div>
        <Button fullWidth onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
