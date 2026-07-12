"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  Package,
  ShoppingBag,
  MapPin,
  RotateCcw,
  CreditCard,
  Headphones,
  Bell,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Gift,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_MODULES } from "@/lib/admin/types";
import { useState } from "react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  customers: Users,
  vendors: Store,
  riders: Bike,
  products: Package,
  orders: ShoppingBag,
  tracking: MapPin,
  refunds: RotateCcw,
  payments: CreditCard,
  referrals: Gift,
  complaints: Headphones,
  reviews: Star,
  notifications: Bell,
  reports: BarChart3,
  settings: Settings,
  audit_logs: Shield,
};

interface AdminSidebarProps {
  adminName: string;
  adminRole: string;
  allowedResources?: string[];
}

export function AdminSidebar({ adminName, adminRole, allowedResources }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = ADMIN_MODULES.filter(
    (m) => !allowedResources || allowedResources.includes(m.resource)
  );

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {!collapsed && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
              Vantoo
            </p>
            <p className="text-sm font-bold text-ink">Admin Portal</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-ink-muted hover:bg-gray-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ resource, label, href }) => {
          const Icon = ICONS[resource] ?? LayoutDashboard;
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-ink-muted hover:bg-gray-50 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-100 p-4">
          <p className="truncate text-sm font-medium text-ink">{adminName}</p>
          <p className="truncate text-xs text-ink-muted capitalize">{adminRole.replace(/_/g, " ")}</p>
        </div>
      )}
    </aside>
  );
}
