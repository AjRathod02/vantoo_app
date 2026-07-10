"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  resource: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs?limit=100")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AdminHeader title="Audit Logs" subtitle="Track all admin actions and changes" />
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-ink-muted">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-ink-muted">No audit logs yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Admin</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-muted">Resource</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-ink">{log.admin_email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {log.resource}
                      {log.resource_id ? ` #${log.resource_id}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
