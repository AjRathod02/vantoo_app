import { isPlatformEnabled, serviceFetch } from "./client";

export interface RiderProfile {
  id: string;
  userId: string;
  fullName: string;
  slug: string;
  phone: string;
  email: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "suspended" | "inactive";
  vehicleType: string;
  vehicleNumber: string | null;
  city: string;
  state: string;
  pincode: string;
  bankAccount: Record<string, unknown>;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiderDashboardStats {
  totalDeliveries: number;
  activeDeliveries: number;
  todayDeliveries: number;
  todayEarnings: number;
  totalEarnings: number;
  rating: number;
}

export interface RiderMeResponse {
  rider: RiderProfile | null;
  stats: RiderDashboardStats | null;
  availability: { riderId: string; status: string; updatedAt: string } | null;
}

export interface RiderDelivery {
  task: {
    id: string;
    orderId: string;
    status: string;
    assignedAt: string;
    acceptedAt: string | null;
    pickedAt: string | null;
    deliveredAt: string | null;
    isActive: boolean;
  };
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  deliveryAddress: Record<string, unknown>;
  serviceType: string;
}

export interface AvailableDelivery {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryAddress: Record<string, unknown>;
  serviceType: string;
  storeName?: string;
  storeAddress?: string;
  placedAt: string;
}

export async function getRiderMe(userId: string): Promise<RiderMeResponse> {
  if (!isPlatformEnabled()) return { rider: null, stats: null, availability: null };
  return serviceFetch<RiderMeResponse>("rider", "/v1/riders/me", { userId });
}

export async function applyRider(userId: string, data: Record<string, unknown>): Promise<RiderProfile> {
  return serviceFetch<RiderProfile>("rider", "/v1/riders/apply", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
}

export async function setRiderAvailability(userId: string, status: "online" | "offline" | "busy") {
  return serviceFetch("rider", "/v1/riders/availability", {
    method: "PUT",
    userId,
    body: JSON.stringify({ status }),
  });
}

export async function updateRiderLocation(
  userId: string,
  data: { latitude: number; longitude: number; orderId?: string }
) {
  return serviceFetch("rider", "/v1/riders/location", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
}

export async function listAvailableDeliveries(userId: string): Promise<AvailableDelivery[]> {
  return serviceFetch<AvailableDelivery[]>("rider", "/v1/riders/deliveries/available", { userId });
}

export async function listRiderDeliveries(userId: string, activeOnly = false): Promise<RiderDelivery[]> {
  const q = activeOnly ? "?active=true" : "";
  return serviceFetch<RiderDelivery[]>("rider", `/v1/riders/deliveries${q}`, { userId });
}

export async function acceptDelivery(userId: string, orderId: string) {
  return serviceFetch("rider", "/v1/riders/deliveries/accept", {
    method: "POST",
    userId,
    body: JSON.stringify({ orderId }),
  });
}

export async function updateRiderDeliveryStatus(userId: string, orderId: string, status: string) {
  return serviceFetch("rider", `/v1/riders/deliveries/${orderId}/status`, {
    method: "PATCH",
    userId,
    body: JSON.stringify({ status }),
  });
}

export async function listRiderEarnings(userId: string) {
  return serviceFetch<Array<Record<string, unknown>>>("rider", "/v1/riders/earnings", { userId });
}

export async function listAdminRiders(userId: string, status?: string): Promise<RiderProfile[]> {
  const q = status ? `?status=${status}` : "";
  return serviceFetch<RiderProfile[]>("rider", `/v1/admin/riders${q}`, { userId });
}

export async function approveRider(userId: string, riderId: string) {
  return serviceFetch<RiderProfile>("rider", `/v1/admin/riders/${riderId}/approve`, {
    method: "POST",
    userId,
  });
}

export async function rejectRider(userId: string, riderId: string, reason: string) {
  return serviceFetch<RiderProfile>("rider", `/v1/admin/riders/${riderId}/reject`, {
    method: "POST",
    userId,
    body: JSON.stringify({ reason }),
  });
}

export async function uploadRiderDocument(userId: string, data: Record<string, unknown>) {
  return serviceFetch("rider", "/v1/riders/documents", {
    method: "POST",
    userId,
    body: JSON.stringify(data),
  });
}
