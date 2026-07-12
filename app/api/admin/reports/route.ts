import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { getDashboardStats, getChartData } from "@/lib/admin/analytics";
import { listAllOrders } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listAdminVendors } from "@/lib/platform/vendors";
import { listAdminRiders } from "@/lib/platform/riders";

function inRange(iso: string | undefined, from?: string | null, to?: string | null) {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to + "T23:59:59").getTime()) return false;
  return true;
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "reports", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "revenue";
    const period = searchParams.get("period") ?? "weekly";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const [stats, charts, orders, products] = await Promise.all([
      getDashboardStats(ctx.admin.id),
      getChartData(),
      listAllOrders(),
      listProducts(),
    ]);

    const rangedOrders = orders.filter((o) => inRange(o.placedAt, from, to));

    let vendors: Array<Record<string, unknown>> = [];
    let riders: Array<Record<string, unknown>> = [];
    let reviews: Array<Record<string, unknown>> = [];
    let tickets: Array<Record<string, unknown>> = [];
    let customers: Array<Record<string, unknown>> = [];

    if (isPlatformEnabled()) {
      try {
        vendors = (await listAdminVendors(ctx.admin.id)) as unknown as Array<
          Record<string, unknown>
        >;
        riders = (await listAdminRiders(ctx.admin.id)) as unknown as Array<
          Record<string, unknown>
        >;
      } catch {
        /* platform optional */
      }
    }

    if (hasAdminClient()) {
      const db = createAdminClient();
      const [cust, r, t] = await Promise.all([
        db
          .from("profiles")
          .select("id, name, email, phone, account_status, created_at")
          .eq("role", "customer")
          .limit(2000),
        db.from("product_reviews").select("*").limit(2000),
        db.from("support_tickets").select("*").limit(2000),
      ]);
      customers = (cust.data ?? []) as Array<Record<string, unknown>>;
      reviews = (r.data ?? []) as Array<Record<string, unknown>>;
      tickets = (t.data ?? []) as Array<Record<string, unknown>>;
    }

    type ReportRow = Record<string, string | number | boolean | null>;

    const orderRows: ReportRow[] = rangedOrders.map((o) => ({
      order_id: o.id,
      status: o.status,
      total: o.total,
      payment_method: o.paymentMethod,
      payment_status: o.paymentStatus ?? "pending",
      city: o.address?.city ?? "",
      service: o.service,
      placed_at: o.placedAt,
      refund_status: o.refundStatus ?? "none",
    }));

    const productRows: ReportRow[] = products.map((p) => ({
      product_id: p.id,
      name: p.name,
      service: p.service,
      category: p.category,
      brand: p.brand,
      price: p.price,
      in_stock: p.inStock,
      rating: p.rating,
    }));

    const reports: Record<string, { report: Record<string, unknown>; rows: ReportRow[] }> = {
      revenue: {
        report: { stats, chart: charts.revenue, period },
        rows: orderRows.filter((o) => o.status !== "cancelled").map((o) => ({
          order_id: o.order_id,
          total: o.total,
          city: o.city,
          placed_at: o.placed_at,
        })),
      },
      orders: {
        report: { stats, chart: charts.orders, period, count: rangedOrders.length },
        rows: orderRows,
      },
      customers: {
        report: { total: customers.length, period },
        rows: customers.map((c) => ({
          id: String(c.id),
          name: String(c.name ?? ""),
          email: String(c.email ?? ""),
          phone: String(c.phone ?? ""),
          status: String(c.account_status ?? "active"),
          created_at: String(c.created_at ?? ""),
        })),
      },
      vendors: {
        report: { total: vendors.length, period },
        rows: vendors.map((v) => ({
          id: String(v.id),
          business_name: String(v.businessName ?? ""),
          email: String(v.contactEmail ?? ""),
          phone: String(v.contactPhone ?? ""),
          status: String(v.status ?? ""),
          created_at: String(v.createdAt ?? ""),
        })),
      },
      riders: {
        report: { total: riders.length, period },
        rows: riders.map((r) => ({
          id: String(r.id),
          name: String(r.fullName ?? ""),
          email: String(r.email ?? ""),
          phone: String(r.phone ?? ""),
          city: String(r.city ?? ""),
          status: String(r.status ?? ""),
          created_at: String(r.createdAt ?? ""),
        })),
      },
      products: {
        report: {
          total: products.length,
          outOfStock: stats.outOfStockProducts,
          byCategory: charts.salesByCategory,
        },
        rows: productRows,
      },
      inventory: {
        report: {
          total: products.length,
          inStock: products.filter((p) => p.inStock).length,
          outOfStock: products.filter((p) => !p.inStock).length,
        },
        rows: productRows.map((p) => ({
          product_id: p.product_id,
          name: p.name,
          service: p.service,
          in_stock: p.in_stock,
          price: p.price,
        })),
      },
      payments: {
        report: { stats, period },
        rows: orderRows.map((o) => ({
          order_id: o.order_id,
          amount: o.total,
          method: o.payment_method,
          status: o.payment_status,
          placed_at: o.placed_at,
        })),
      },
      refunds: {
        report: { chart: charts.refundTrends, count: stats.refundRequests },
        rows: orderRows
          .filter((o) => o.refund_status && o.refund_status !== "none")
          .map((o) => ({
            order_id: o.order_id,
            total: o.total,
            refund_status: o.refund_status,
            placed_at: o.placed_at,
          })),
      },
      reviews: {
        report: { total: reviews.length, period },
        rows: reviews.map((r) => ({
          id: String(r.id),
          product_id: String(r.product_id ?? ""),
          rating: Number(r.rating ?? 0),
          body: String(r.body ?? "").slice(0, 120),
          status: String(r.moderation_status ?? (r.is_published ? "published" : "hidden")),
          created_at: String(r.created_at ?? ""),
        })),
      },
      complaints: {
        report: { total: tickets.length, period },
        rows: tickets.map((t) => ({
          ticket: String(t.ticket_number ?? t.id),
          user: String(t.user_name ?? ""),
          user_type: String(t.user_type ?? ""),
          category: String(t.category ?? ""),
          priority: String(t.priority ?? ""),
          status: String(t.status ?? ""),
          created_at: String(t.created_at ?? ""),
        })),
      },
      delivery: {
        report: {
          completed: stats.completedOrders,
          pending: stats.pendingOrders,
          cancelled: stats.cancelledOrders,
        },
        rows: orderRows.map((o) => ({
          order_id: o.order_id,
          status: o.status,
          city: o.city,
          placed_at: o.placed_at,
        })),
      },
      cancellations: {
        report: { chart: charts.cancellationTrends, count: stats.cancelledOrders },
        rows: orderRows
          .filter((o) => o.status === "cancelled")
          .map((o) => ({
            order_id: o.order_id,
            total: o.total,
            city: o.city,
            placed_at: o.placed_at,
          })),
      },
      geographic: {
        report: rangedOrders.reduce(
          (acc, o) => {
            const city = o.address?.city ?? "Unknown";
            acc[city] = (acc[city] ?? 0) + o.total;
            return acc;
          },
          {} as Record<string, number>
        ),
        rows: Object.entries(
          rangedOrders.reduce(
            (acc, o) => {
              const city = o.address?.city ?? "Unknown";
              acc[city] = (acc[city] ?? 0) + o.total;
              return acc;
            },
            {} as Record<string, number>
          )
        ).map(([city, revenue]) => ({ city, revenue })),
      },
    };

    const selected = reports[type] ?? reports.revenue;

    return NextResponse.json({
      report: selected.report,
      rows: selected.rows,
      type,
      period,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (
      !hasPermission(ctx.permissions, "reports", "create") &&
      !hasPermission(ctx.permissions, "reports", "read")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action as string;

    if (!hasAdminClient()) {
      return NextResponse.json({ success: true, stored: false });
    }

    const db = createAdminClient();

    if (action === "audit_export") {
      await db.from("admin_report_exports").insert({
        admin_id: ctx.admin.id,
        admin_email: ctx.admin.email,
        report_type: body.reportType,
        format: body.format,
        date_from: body.from,
        date_to: body.to,
        filters: { period: body.period },
        row_count: body.rowCount ?? 0,
      });
      await logAdminAction({
        adminId: ctx.admin.id,
        adminEmail: ctx.admin.email,
        action: "create",
        resource: "reports",
        details: { export: body.format, type: body.reportType },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "schedule") {
      const { data, error } = await db
        .from("admin_scheduled_reports")
        .insert({
          admin_id: ctx.admin.id,
          report_type: body.reportType,
          format: body.format ?? "csv",
          cadence: body.cadence ?? "weekly",
          email_to: body.emailTo ?? "",
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        adminId: ctx.admin.id,
        adminEmail: ctx.admin.email,
        action: "create",
        resource: "reports",
        details: { schedule: body },
      });
      return NextResponse.json({ schedule: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
