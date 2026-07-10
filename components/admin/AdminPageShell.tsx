"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Consistent admin page layout with header and padded content away from the sidebar. */
export function AdminPageShell({ title, subtitle, children }: AdminPageShellProps) {
  return (
    <>
      <AdminHeader title={title} subtitle={subtitle} />
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8">{children}</div>
    </>
  );
}
