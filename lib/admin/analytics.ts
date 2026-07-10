import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { listProducts } from "@/lib/server/products";
import { listAllOrders } from "@/lib/server/orders";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listAdminVendors } from "@/lib/platform/vendors";
import { listAdminRiders } from "@/lib/platform/riders";
import type { DashboardStats, ChartDataPoint } from "./types";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getDashboardStats(adminId = "system"): Promise<DashboardStats> {
  const [products, orders] = await Promise.all([listProducts(), listAllOrders()]);

  const today = startOfDay();
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const paidOrders = orders.filter(
    (o) => o.paymentStatus === "paid" || o.paymentMethod === "cod"
  );

  const todayOrders = orders.filter((o) => new Date(o.placedAt) >= today);
  const todayRevenue = todayOrders
    .filter((o) => o.paymentStatus === "paid" || o.paymentMethod === "cod")
    .reduce((s, o) => s + o.total, 0);

  const weeklyRevenue = paidOrders
    .filter((o) => new Date(o.placedAt) >= weekAgo)
    .reduce((s, o) => s + o.total, 0);

  const monthlyRevenue = paidOrders
    .filter((o) => new Date(o.placedAt) >= monthAgo)
    .reduce((s, o) => s + o.total, 0);

  let totalCustomers = 0;
  let totalVendors = 0;
  let totalRiders = 0;
  let pendingVendorApprovals = 0;
  let pendingRiderApprovals = 0;
  let supportTickets = 0;
  let customerSatisfaction = 4.2;

  if (hasAdminClient()) {
    const db = createAdminClient();
    const [profiles, tickets] = await Promise.all([
      db.from("profiles").select("id, role", { count: "exact", head: false }),
      db.from("support_tickets").select("id, status, satisfaction_rating").neq("status", "closed"),
    ]);

    totalCustomers = profiles.data?.filter((p) => p.role === "customer").length ?? 0;

    if (tickets.data) {
      supportTickets = tickets.data.length;
      const rated = tickets.data.filter((t) => t.satisfaction_rating);
      if (rated.length) {
        customerSatisfaction =
          rated.reduce((s, t) => s + (t.satisfaction_rating as number), 0) / rated.length;
      }
    }
  }

  if (isPlatformEnabled()) {
    try {
      const [vendors, riders] = await Promise.all([
        listAdminVendors(adminId),
        listAdminRiders(adminId),
      ]);
      totalVendors = vendors.length;
      totalRiders = riders.length;
      pendingVendorApprovals = vendors.filter((v) => v.status === "pending").length;
      pendingRiderApprovals = riders.filter((r) => r.status === "pending").length;
    } catch {
      // platform unavailable
    }
  }

  return {
    totalCustomers,
    totalVendors,
    totalRiders,
    activeUsers: totalCustomers + totalVendors + totalRiders,
    onlineRiders: 0,
    pendingVendorApprovals,
    pendingRiderApprovals,
    totalProducts: products.length,
    outOfStockProducts: products.filter((p) => !p.inStock).length,
    todayOrders: todayOrders.length,
    completedOrders: orders.filter((o) => o.status === "delivered").length,
    pendingOrders: orders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status)
    ).length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    returnedOrders: 0,
    refundRequests: orders.filter((o) => o.refundStatus === "requested").length,
    totalRevenue: paidOrders.reduce((s, o) => s + o.total, 0),
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
    totalWalletBalance: 0,
    activeCoupons: 0,
    supportTickets,
    customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
  };
}

export async function getChartData(): Promise<{
  revenue: ChartDataPoint[];
  orders: ChartDataPoint[];
  salesByCategory: ChartDataPoint[];
  customerGrowth: ChartDataPoint[];
  refundTrends: ChartDataPoint[];
  cancellationTrends: ChartDataPoint[];
}> {
  const orders = await listAllOrders();
  const products = await listProducts();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: startOfDay(d),
      nextDate: startOfDay(new Date(d.getTime() + 86400000)),
    };
  });

  const revenue = last7Days.map(({ label, date, nextDate }) => ({
    label,
    value: orders
      .filter(
        (o) =>
          new Date(o.placedAt) >= date &&
          new Date(o.placedAt) < nextDate &&
          (o.paymentStatus === "paid" || o.paymentMethod === "cod")
      )
      .reduce((s, o) => s + o.total, 0),
  }));

  const orderChart = last7Days.map(({ label, date, nextDate }) => ({
    label,
    value: orders.filter(
      (o) => new Date(o.placedAt) >= date && new Date(o.placedAt) < nextDate
    ).length,
  }));

  const categoryMap = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const cat = item.name?.split(" ")[0] ?? order.service ?? "Other";
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.quantity * item.price);
    }
  }
  const salesByCategory = [...categoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  let customerGrowth = last7Days.map(({ label }) => ({ label, value: 0 }));
  if (hasAdminClient()) {
    const { data: profiles } = await createAdminClient()
      .from("profiles")
      .select("created_at")
      .eq("role", "customer");
    if (profiles?.length) {
      customerGrowth = last7Days.map(({ label, date, nextDate }) => ({
        label,
        value: profiles.filter(
          (p) =>
            new Date(p.created_at as string) >= date &&
            new Date(p.created_at as string) < nextDate
        ).length,
      }));
    }
  }

  const refundTrends = last7Days.map(({ label, date, nextDate }) => ({
    label,
    value: orders.filter(
      (o) =>
        o.refundStatus &&
        o.refundStatus !== "none" &&
        new Date(o.placedAt) >= date &&
        new Date(o.placedAt) < nextDate
    ).length,
  }));

  const cancellationTrends = last7Days.map(({ label, date, nextDate }) => ({
    label,
    value: orders.filter(
      (o) =>
        o.status === "cancelled" &&
        new Date(o.placedAt) >= date &&
        new Date(o.placedAt) < nextDate
    ).length,
  }));

  void products;
  return { revenue, orders: orderChart, salesByCategory, customerGrowth, refundTrends, cancellationTrends };
}
