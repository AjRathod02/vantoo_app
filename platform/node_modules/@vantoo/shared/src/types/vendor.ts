export type VendorStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "inactive";

export type StoreType = "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop";
export type DocumentType =
  | "pan"
  | "gst"
  | "fssai"
  | "drug_license"
  | "bank_proof"
  | "identity"
  | "address_proof"
  | "other";
export type DocumentStatus = "pending" | "verified" | "rejected" | "expired";

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  legalName: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  status: VendorStatus;
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

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: DocumentType;
  documentNumber: string | null;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Store {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  storeType: StoreType;
  serviceTypes: string[];
  description: string;
  imageUrl: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  avgDeliveryMins: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface StoreTiming {
  id: string;
  storeId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface VendorStaff {
  id: string;
  vendorId: string;
  storeId: string | null;
  userId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface VendorDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  totalProducts: number;
  activeProducts: number;
  storeCount: number;
}

export interface VendorApplyInput {
  businessName: string;
  legalName?: string;
  description?: string;
  contactEmail: string;
  contactPhone: string;
  gstNumber?: string;
  panNumber?: string;
  storeType: StoreType;
  storeName: string;
  addressLine1: string;
  city: string;
  pincode: string;
  state?: string;
}
