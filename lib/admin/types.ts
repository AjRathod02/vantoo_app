export type AdminRole =
  | "super_admin"
  | "admin"
  | "support_manager"
  | "operations_manager"
  | "finance_manager"
  | "inventory_manager"
  | "marketing_manager"
  | "analyst";

export type AdminStatus = "active" | "inactive" | "suspended" | "blocked";

export type PermissionAction = "create" | "read" | "update" | "delete";

export type AdminResource =
  | "dashboard"
  | "customers"
  | "vendors"
  | "riders"
  | "products"
  | "orders"
  | "refunds"
  | "payments"
  | "complaints"
  | "notifications"
  | "reports"
  | "tracking"
  | "settings"
  | "admin_users"
  | "audit_logs"
  | "referrals"
  | "reviews";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: AdminRole;
  status: AdminStatus;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  adminId: string;
  deviceName: string;
  browser?: string;
  platform: string;
  ipAddress?: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface AdminPermission {
  resource: AdminResource;
  action: PermissionAction;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  sessionId: string;
  type: "admin_access";
}

export type TicketCategory =
  | "payment"
  | "refund"
  | "delivery"
  | "product_quality"
  | "vendor"
  | "rider"
  | "technical"
  | "account"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed" | "escalated";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  userType: "customer" | "vendor" | "rider";
  userName: string;
  userEmail?: string;
  userPhone?: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  assignedTo?: string;
  orderId?: string;
  resolution?: string;
  satisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalVendors: number;
  totalRiders: number;
  activeUsers: number;
  onlineRiders: number;
  pendingVendorApprovals: number;
  pendingRiderApprovals: number;
  totalProducts: number;
  outOfStockProducts: number;
  todayOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  refundRequests: number;
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalWalletBalance: number;
  activeCoupons: number;
  supportTickets: number;
  customerSatisfaction: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support_manager: "Support Manager",
  operations_manager: "Operations Manager",
  finance_manager: "Finance Manager",
  inventory_manager: "Inventory Manager",
  marketing_manager: "Marketing Manager",
  analyst: "Analyst",
};

export const ADMIN_MODULES: { resource: AdminResource; label: string; href: string }[] = [
  { resource: "dashboard", label: "Dashboard", href: "/admin" },
  { resource: "customers", label: "Customers", href: "/admin/customers" },
  { resource: "vendors", label: "Vendors", href: "/admin/vendors" },
  { resource: "riders", label: "Riders", href: "/admin/riders" },
  { resource: "products", label: "Products", href: "/admin/products" },
  { resource: "products", label: "Categories", href: "/admin/categories" },
  { resource: "notifications", label: "Coupons", href: "/admin/coupons" },
  { resource: "complaints", label: "Help Center", href: "/admin/help" },
  { resource: "orders", label: "Orders", href: "/admin/orders" },
  { resource: "tracking", label: "Live Tracking", href: "/admin/tracking" },
  { resource: "refunds", label: "Refunds", href: "/admin/refunds" },
  { resource: "payments", label: "Payments", href: "/admin/payments" },
  { resource: "referrals", label: "Referrals", href: "/admin/referrals" },
  { resource: "vendors", label: "Sponsorships", href: "/admin/sponsorships" },
  { resource: "complaints", label: "Support", href: "/admin/complaints" },
  { resource: "reviews", label: "Reviews", href: "/admin/reviews" },
  { resource: "notifications", label: "Notifications", href: "/admin/notifications" },
  { resource: "reports", label: "Reports", href: "/admin/reports" },
  { resource: "settings", label: "Settings", href: "/admin/settings" },
  { resource: "audit_logs", label: "Audit Logs", href: "/admin/audit-logs" },
];
