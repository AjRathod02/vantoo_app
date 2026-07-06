import { isPlatformEnabled, serviceFetch } from "./client";
import type { Product } from "@/lib/types";

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  legalName: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  status: "pending" | "under_review" | "approved" | "rejected" | "suspended" | "inactive";
  commissionRate: number;
  contactEmail: string;
  contactPhone: string;
  gstNumber: string | null;
  panNumber: string | null;
  bankAccount: Record<string, unknown>;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  totalProducts: number;
  activeProducts: number;
  storeCount: number;
}

export interface VendorMeResponse {
  vendor: VendorProfile | null;
  stats: VendorDashboardStats | null;
}

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: string;
  documentNumber: string | null;
  fileUrl: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface VendorStore {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  storeType: string;
  serviceTypes: string[];
  addressLine1: string;
  city: string;
  pincode: string;
  isActive: boolean;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  avgDeliveryMins: number;
}

export async function getVendorMe(userId: string): Promise<VendorMeResponse> {
  if (!isPlatformEnabled()) return { vendor: null, stats: null };
  return serviceFetch<VendorMeResponse>("vendor", "/v1/vendors/me", { userId });
}

export async function applyVendor(userId: string, data: Record<string, unknown>): Promise<VendorProfile> {
  return serviceFetch<VendorProfile>("vendor", "/v1/vendors/apply", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
}

export async function listVendorProducts(userId: string): Promise<Product[]> {
  const items = await serviceFetch<Array<Record<string, unknown>>>("vendor", "/v1/vendors/products", { userId });
  return items.map(mapProduct);
}

export async function createVendorProduct(userId: string, data: Record<string, unknown>) {
  const item = await serviceFetch<Record<string, unknown>>("vendor", "/v1/vendors/products", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
  return mapProduct(item);
}

export async function publishVendorProduct(userId: string, productId: string) {
  const item = await serviceFetch<Record<string, unknown>>(
    "vendor",
    `/v1/vendors/products/${productId}/publish`,
    { method: "POST", userId }
  );
  return mapProduct(item);
}

export async function listVendorOrders(userId: string) {
  return serviceFetch<Array<Record<string, unknown>>>("vendor", "/v1/vendors/orders", { userId });
}

export async function updateVendorOrderStatus(userId: string, orderId: string, status: string) {
  return serviceFetch("vendor", `/v1/vendors/orders/${orderId}/status`, {
    method: "PATCH",
    userId,
    body: JSON.stringify({ status }),
  });
}

export async function listVendorDocuments(userId: string): Promise<VendorDocument[]> {
  return serviceFetch<VendorDocument[]>("vendor", "/v1/vendors/documents", { userId });
}

export async function uploadVendorDocument(userId: string, data: Record<string, unknown>) {
  return serviceFetch<VendorDocument>("vendor", "/v1/vendors/documents", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
}

export async function listVendorStores(userId: string): Promise<VendorStore[]> {
  return serviceFetch<VendorStore[]>("vendor", "/v1/vendors/stores", { userId });
}

export async function listAdminVendors(userId: string, status?: string): Promise<VendorProfile[]> {
  const q = status ? `?status=${status}` : "";
  return serviceFetch<VendorProfile[]>("vendor", `/v1/admin/vendors${q}`, { userId });
}

export async function approveVendor(userId: string, vendorId: string) {
  return serviceFetch<VendorProfile>("vendor", `/v1/admin/vendors/${vendorId}/approve`, {
    method: "POST",
    userId,
  });
}

export async function rejectVendor(userId: string, vendorId: string, reason: string) {
  return serviceFetch<VendorProfile>("vendor", `/v1/admin/vendors/${vendorId}/reject`, {
    method: "POST",
    userId,
    body: JSON.stringify({ reason }),
  });
}

function mapProduct(p: Record<string, unknown>): Product {
  return {
    id: (p.legacyId as string) ?? (p.id as string),
    platformId: p.id as string,
    variantId: p.variantId as string | undefined,
    name: p.name as string,
    description: (p.description as string) ?? "",
    service: p.serviceType as Product["service"],
    category: (p.categoryName as string) ?? "",
    brand: (p.brandName as string) ?? "",
    price: Number(p.basePrice),
    originalPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
    rating: Number(p.rating ?? 4),
    reviews: Number(p.reviewCount ?? 0),
    image: (p.image as string) ?? "",
    vendorId: p.vendorId as string,
    inStock: Boolean(p.inStock),
    unit: p.unit as string | undefined,
  };
}
