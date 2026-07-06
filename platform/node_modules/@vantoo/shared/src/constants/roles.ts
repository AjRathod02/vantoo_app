import type { SystemRole } from "../types/auth.js";

export const SYSTEM_ROLES: SystemRole[] = [
  "super_admin",
  "admin",
  "finance_team",
  "area_manager",
  "support_executive",
  "restaurant_owner",
  "grocery_store",
  "ecommerce_seller",
  "vendor",
  "delivery_rider",
  "customer",
];

export const VENDOR_ROLES: SystemRole[] = [
  "restaurant_owner",
  "grocery_store",
  "ecommerce_seller",
  "vendor",
];

export const ADMIN_ROLES: SystemRole[] = [
  "super_admin",
  "admin",
  "finance_team",
  "area_manager",
  "support_executive",
];

export const DEFAULT_CUSTOMER_ROLE: SystemRole = "customer";
