import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/types";

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let ctx;
  try {
    ctx = await requireAdminAuth();
  } catch {
    redirect("/admin/login");
  }

  const allowedResources = ctx.permissions.map((p) => p.resource);
  const uniqueResources = [...new Set(allowedResources)];

  // Show Referrals nav before DB permission seed if admin can manage settings/payments
  if (
    !uniqueResources.includes("referrals") &&
    (uniqueResources.includes("settings") ||
      uniqueResources.includes("payments") ||
      ctx.admin.role === "super_admin" ||
      ctx.admin.role === "admin")
  ) {
    uniqueResources.push("referrals");
  }

  if (
    !uniqueResources.includes("reviews") &&
    (ctx.admin.role === "super_admin" ||
      ctx.admin.role === "admin" ||
      uniqueResources.includes("products") ||
      uniqueResources.includes("complaints"))
  ) {
    uniqueResources.push("reviews");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        adminName={ctx.admin.name}
        adminRole={ADMIN_ROLE_LABELS[ctx.admin.role] ?? ctx.admin.role}
        allowedResources={uniqueResources}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
        {children}
      </main>
    </div>
  );
}
