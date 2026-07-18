import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listAllOrders } from "@/lib/server/orders";
import { AdminUnauthorizedError, adminErrorResponse } from "@/lib/admin/auth";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await listAllOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    if (
      error instanceof AdminUnauthorizedError ||
      (error instanceof Error &&
        (error.message === "Unauthorized" || error.message === "Forbidden"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return adminErrorResponse(error);
  }
}
