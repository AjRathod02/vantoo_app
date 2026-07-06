export type RiderStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "inactive";

export type VehicleType = "bicycle" | "motorcycle" | "scooter" | "car" | "van" | "walk";

export type RiderDocumentType =
  | "driving_license"
  | "aadhaar"
  | "pan"
  | "vehicle_rc"
  | "insurance"
  | "identity"
  | "address_proof"
  | "other";

export type RiderDocumentStatus = "pending" | "verified" | "rejected" | "expired";

export type AvailabilityStatus = "online" | "offline" | "busy";

export type DeliveryTaskStatus =
  | "assigned"
  | "accepted"
  | "picked"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Rider {
  id: string;
  userId: string;
  fullName: string;
  slug: string;
  phone: string;
  email: string;
  status: RiderStatus;
  vehicleType: VehicleType;
  vehicleNumber: string | null;
  city: string;
  state: string;
  pincode: string;
  bankAccount: Record<string, unknown>;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiderDocument {
  id: string;
  riderId: string;
  documentType: RiderDocumentType;
  documentNumber: string | null;
  fileUrl: string;
  status: RiderDocumentStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface RiderAvailability {
  riderId: string;
  status: AvailabilityStatus;
  updatedAt: string;
}

export interface RiderLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  riderId: string;
  status: DeliveryTaskStatus;
  assignedAt: string;
  acceptedAt: string | null;
  pickedAt: string | null;
  deliveredAt: string | null;
  pickupAddress: Record<string, unknown>;
  deliveryAddress: Record<string, unknown>;
  isActive: boolean;
}

export interface RiderEarning {
  id: string;
  riderId: string;
  orderId: string | null;
  amount: number;
  earningType: string;
  status: string;
  createdAt: string;
}

export interface RiderDashboardStats {
  totalDeliveries: number;
  activeDeliveries: number;
  todayDeliveries: number;
  todayEarnings: number;
  totalEarnings: number;
  rating: number;
}

export interface RiderApplyInput {
  fullName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  city: string;
  pincode: string;
  state?: string;
}

export interface OrderTrackingInfo {
  orderId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  riderLat: number;
  riderLng: number;
  status: string;
  updatedAt: string;
}
