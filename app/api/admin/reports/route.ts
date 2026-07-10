import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { getDashboardStats, getChartData } from "@/lib/admin/analytics";
import { listAllOrders } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "reports", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "revenue";
    const period = searchParams.get("period") ?? "weekly";

    const [stats, charts, orders, products] = await Promise.all([
      getDashboardStats(ctx.admin.id),
      getChartData(),
      listAllOrders(),
      listProducts(),
    ]);

    const reports: Record<string, unknown> = {
      revenue: { stats, chart: charts.revenue, period },
      orders: { stats, chart: charts.orders, period },
      refunds: { chart: charts.refundTrends, count: stats.refundRequests },
      cancellations: { chart: charts.cancellationTrends, count: stats.cancelledOrders },
      products: {
        total: products.length,
        outOfStock: stats.outOfStockProducts,
        byCategory: charts.salesByCategory,
      },
      delivery: {
        completed: stats.completedOrders,
        pending: stats.pendingOrders,
        cancelled: stats.cancelledOrders,
      },
      geographic: orders.reduce(
        (acc, o) => {
          const city = o.address?.city ?? "Unknown";
          acc[city] = (acc[city] ?? 0) + o.total;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({ report: reports[type] ?? reports.revenue, type, period });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
