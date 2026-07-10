"use client";

import { LogOut, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/stores/toast";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div>
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl p-2 text-ink-muted hover:bg-gray-50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-ink-muted hover:border-brand-primary hover:text-brand-primary"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
