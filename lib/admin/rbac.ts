import type { AdminPermission, AdminResource, PermissionAction } from "./types";
import { getAdminPermissions } from "./db";
import type { AdminRole } from "./types";

const permissionCache = new Map<string, AdminPermission[]>();

export async function loadPermissions(role: AdminRole): Promise<AdminPermission[]> {
  const cached = permissionCache.get(role);
  if (cached) return cached;
  const perms = await getAdminPermissions(role);
  permissionCache.set(role, perms);
  return perms;
}

export function hasPermission(
  permissions: AdminPermission[],
  resource: AdminResource,
  action: PermissionAction
): boolean {
  return permissions.some((p) => p.resource === resource && p.action === action);
}

export function canRead(permissions: AdminPermission[], resource: AdminResource): boolean {
  return hasPermission(permissions, resource, "read");
}

export async function requirePermission(
  role: AdminRole,
  resource: AdminResource,
  action: PermissionAction
): Promise<void> {
  const perms = await loadPermissions(role);
  if (!hasPermission(perms, resource, action)) {
    throw new Error("Forbidden");
  }
}

export function clearPermissionCache() {
  permissionCache.clear();
}
