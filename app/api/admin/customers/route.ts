import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { listAllOrders } from "@/lib/server/orders";

export type AdminCustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  referral_code: string | null;
  total_orders: number;
  total_spending: number;
  wallet_balance: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: string;
};

const FULL_SELECT =
  "id, name, email, phone, avatar_url, date_of_birth, gender, account_status, created_at, last_login_at, email_verified, phone_verified, referral_code, role";
const BASIC_SELECT = "id, name, email, phone, date_of_birth, created_at, role";

function canAccessCustomers(
  permissions: { resource: string; action: string }[],
  role: string
) {
  if (role === "super_admin" || role === "admin") return true;
  if (!permissions.length) return true; // legacy / unseeded — allow authenticated admin
  return canRead(permissions as Parameters<typeof canRead>[0], "customers");
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!canAccessCustomers(ctx.permissions, ctx.admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ customers: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "";
    const city = searchParams.get("city")?.toLowerCase() ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const db = createAdminClient();

    let profiles: Record<string, unknown>[] | null = null;
    let profileError: { message: string } | null = null;

    const fullRes = await db
      .from("profiles")
      .select(FULL_SELECT)
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (fullRes.error) {
      console.warn("Customer full select failed, using basic columns:", fullRes.error.message);
      const basicRes = await db
        .from("profiles")
        .select(BASIC_SELECT)
        .eq("role", "customer")
        .order("created_at", { ascending: false });
      profiles = (basicRes.data ?? null) as Record<string, unknown>[] | null;
      profileError = basicRes.error;
    } else {
      profiles = (fullRes.data ?? null) as Record<string, unknown>[] | null;
    }

    const [orders, addressesRes, walletsRes] = await Promise.all([
      listAllOrders().catch((e) => {
        console.error("listAllOrders failed:", e);
        return [];
      }),
      db.from("addresses").select("*"),
      db.from("referral_wallets").select("user_id, balance"),
    ]);

    if (profileError) {
      console.error("Customer profiles query failed:", profileError);
      return NextResponse.json(
        { error: profileError.message, customers: [], total: 0 },
        { status: 500 }
      );
    }

    const addresses = addressesRes.error ? [] : addressesRes.data ?? [];
    const wallets = walletsRes.error ? [] : walletsRes.data ?? [];

    const orderStats = new Map<string, { count: number; spend: number }>();
    for (const o of orders) {
      if (!o.userId) continue;
      const cur = orderStats.get(o.userId) ?? { count: 0, spend: 0 };
      cur.count += 1;
      if (o.status !== "cancelled") cur.spend += o.total;
      orderStats.set(o.userId, cur);
    }

    const addressByUser = new Map<string, (typeof addresses)[number]>();
    for (const a of addresses) {
      const existing = addressByUser.get(a.user_id);
      if (!existing || a.is_default) addressByUser.set(a.user_id, a);
    }

    const walletByUser = new Map<string, number>();
    for (const w of wallets) {
      walletByUser.set(w.user_id, Number(w.balance ?? 0));
    }

    let customers: AdminCustomerRow[] = (profiles ?? []).map((row) => {
      const addr = addressByUser.get(String(row.id));
      const stats = orderStats.get(String(row.id)) ?? { count: 0, spend: 0 };
      const emailVerified = Boolean(row.email_verified);
      const phoneVerified = Boolean(row.phone_verified);
      const verification =
        emailVerified && phoneVerified
          ? "fully_verified"
          : emailVerified || phoneVerified
            ? "partial"
            : "unverified";

      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        email: (row.email as string | null) ?? null,
        phone: (row.phone as string | null) ?? null,
        avatar_url: (row.avatar_url as string | null) ?? null,
        date_of_birth: (row.date_of_birth as string | null) ?? null,
        gender: (row.gender as string | null) ?? null,
        account_status: String(row.account_status ?? "active"),
        created_at: String(row.created_at),
        last_login_at: (row.last_login_at as string | null) ?? null,
        email_verified: emailVerified,
        phone_verified: phoneVerified,
        referral_code: (row.referral_code as string | null) ?? null,
        total_orders: stats.count,
        total_spending: stats.spend,
        wallet_balance: walletByUser.get(String(row.id)) ?? 0,
        address: [addr?.line1, addr?.line2].filter(Boolean).join(", "),
        city: addr?.city ?? "",
        state: (addr as { state?: string } | undefined)?.state ?? "",
        pincode: addr?.pincode ?? "",
        verification_status: verification,
      };
    });

    if (search) {
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.includes(search) ||
          c.id.toLowerCase().includes(search) ||
          c.referral_code?.toLowerCase().includes(search) ||
          c.city?.toLowerCase().includes(search)
      );
    }
    if (status) {
      customers = customers.filter((c) => c.account_status === status);
    }
    if (city) {
      customers = customers.filter((c) => c.city.toLowerCase().includes(city));
    }

    customers.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "orders":
          return b.total_orders - a.total_orders;
        case "spending":
          return b.total_spending - a.total_spending;
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    const total = customers.length;
    const start = (page - 1) * limit;
    const pageRows = customers.slice(start, start + limit);

    return NextResponse.json({ customers: pageRows, total, page, limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    console.error("GET /api/admin/customers:", e);
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
