import { z } from "zod";
export const vendorApplySchema = z.object({
    businessName: z.string().min(2).max(100),
    legalName: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    contactEmail: z.string().email(),
    contactPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
    gstNumber: z.string().max(20).optional(),
    panNumber: z.string().max(15).optional(),
    storeType: z.enum(["restaurant", "grocery", "pharmacy", "ecommerce", "local_shop"]),
    storeName: z.string().min(2).max(100),
    addressLine1: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    pincode: z.string().min(4).max(10),
    state: z.string().max(100).optional(),
});
export const vendorUpdateSchema = z.object({
    businessName: z.string().min(2).max(100).optional(),
    legalName: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
    gstNumber: z.string().max(20).optional(),
    panNumber: z.string().max(15).optional(),
    logoUrl: z.string().url().optional(),
    bankAccount: z.record(z.unknown()).optional(),
});
export const documentUploadSchema = z.object({
    documentType: z.enum(["pan", "gst", "fssai", "drug_license", "bank_proof", "identity", "address_proof", "other"]),
    documentNumber: z.string().max(50).optional(),
    fileUrl: z.string().url(),
    expiresAt: z.string().datetime().optional(),
});
export const storeCreateSchema = z.object({
    name: z.string().min(2).max(100),
    storeType: z.enum(["restaurant", "grocery", "pharmacy", "ecommerce", "local_shop"]),
    serviceTypes: z.array(z.enum(["food", "grocery", "medicine", "ecommerce", "local_shop"])).min(1),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().max(100).optional(),
    pincode: z.string().min(4).max(10),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deliveryRadiusKm: z.number().min(0.5).max(50).optional(),
    minOrderAmount: z.number().min(0).optional(),
    avgDeliveryMins: z.number().min(5).max(180).optional(),
});
export const storeUpdateSchema = storeCreateSchema.partial();
export const storeTimingSchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    closeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    isClosed: z.boolean().optional(),
});
export const vendorProductSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    serviceType: z.enum(["food", "grocery", "medicine", "ecommerce", "local_shop"]),
    categoryName: z.string().max(100).optional(),
    brandName: z.string().max(100).optional(),
    basePrice: z.number().positive(),
    compareAtPrice: z.number().positive().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    imageUrl: z.string().url().optional(),
    unit: z.string().max(50).optional(),
    storeId: z.string().uuid().optional(),
    initialStock: z.number().int().min(0).default(0),
});
export const vendorProductUpdateSchema = vendorProductSchema.partial();
export const vendorRejectSchema = z.object({
    reason: z.string().min(5).max(500),
});
export const vendorOrderStatusSchema = z.object({
    status: z.enum(["confirmed", "preparing", "packed", "cancelled"]),
});
