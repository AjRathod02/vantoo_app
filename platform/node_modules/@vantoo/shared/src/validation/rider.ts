import { z } from "zod";

export const riderApplySchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  email: z.string().email(),
  vehicleType: z.enum(["bicycle", "motorcycle", "scooter", "car", "van", "walk"]),
  vehicleNumber: z.string().max(20).optional(),
  city: z.string().min(2).max(100),
  pincode: z.string().min(4).max(10),
  state: z.string().max(100).optional(),
});

export const riderUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  email: z.string().email().optional(),
  vehicleType: z.enum(["bicycle", "motorcycle", "scooter", "car", "van", "walk"]).optional(),
  vehicleNumber: z.string().max(20).optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  state: z.string().max(100).optional(),
  bankAccount: z.record(z.unknown()).optional(),
});

export const riderDocumentSchema = z.object({
  documentType: z.enum([
    "driving_license", "aadhaar", "pan", "vehicle_rc", "insurance", "identity", "address_proof", "other",
  ]),
  documentNumber: z.string().max(50).optional(),
  fileUrl: z.string().url(),
  expiresAt: z.string().datetime().optional(),
});

export const riderAvailabilitySchema = z.object({
  status: z.enum(["online", "offline", "busy"]),
});

export const riderLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().min(0).optional(),
  orderId: z.string().uuid().optional(),
});

export const riderRejectSchema = z.object({
  reason: z.string().min(5).max(500),
});

export const riderOrderStatusSchema = z.object({
  status: z.enum(["picked", "in_transit", "delivered", "cancelled"]),
});

export const deliveryProofSchema = z.object({
  proofType: z.enum(["photo", "signature", "otp"]).default("photo"),
  fileUrl: z.string().url(),
  otp: z.string().max(10).optional(),
});

export const acceptDeliverySchema = z.object({
  orderId: z.string().uuid(),
});
