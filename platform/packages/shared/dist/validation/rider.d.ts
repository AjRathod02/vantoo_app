import { z } from "zod";
export declare const riderApplySchema: z.ZodObject<{
    fullName: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    vehicleType: z.ZodEnum<["bicycle", "motorcycle", "scooter", "car", "van", "walk"]>;
    vehicleNumber: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    pincode: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    city: string;
    pincode: string;
    fullName: string;
    phone: string;
    email: string;
    vehicleType: "bicycle" | "motorcycle" | "scooter" | "car" | "van" | "walk";
    state?: string | undefined;
    vehicleNumber?: string | undefined;
}, {
    city: string;
    pincode: string;
    fullName: string;
    phone: string;
    email: string;
    vehicleType: "bicycle" | "motorcycle" | "scooter" | "car" | "van" | "walk";
    state?: string | undefined;
    vehicleNumber?: string | undefined;
}>;
export declare const riderUpdateSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    vehicleType: z.ZodOptional<z.ZodEnum<["bicycle", "motorcycle", "scooter", "car", "van", "walk"]>>;
    vehicleNumber: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    bankAccount: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    city?: string | undefined;
    pincode?: string | undefined;
    state?: string | undefined;
    bankAccount?: Record<string, unknown> | undefined;
    fullName?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    vehicleType?: "bicycle" | "motorcycle" | "scooter" | "car" | "van" | "walk" | undefined;
    vehicleNumber?: string | undefined;
}, {
    city?: string | undefined;
    pincode?: string | undefined;
    state?: string | undefined;
    bankAccount?: Record<string, unknown> | undefined;
    fullName?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    vehicleType?: "bicycle" | "motorcycle" | "scooter" | "car" | "van" | "walk" | undefined;
    vehicleNumber?: string | undefined;
}>;
export declare const riderDocumentSchema: z.ZodObject<{
    documentType: z.ZodEnum<["driving_license", "aadhaar", "pan", "vehicle_rc", "insurance", "identity", "address_proof", "other"]>;
    documentNumber: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    documentType: "pan" | "identity" | "address_proof" | "other" | "driving_license" | "aadhaar" | "vehicle_rc" | "insurance";
    fileUrl: string;
    documentNumber?: string | undefined;
    expiresAt?: string | undefined;
}, {
    documentType: "pan" | "identity" | "address_proof" | "other" | "driving_license" | "aadhaar" | "vehicle_rc" | "insurance";
    fileUrl: string;
    documentNumber?: string | undefined;
    expiresAt?: string | undefined;
}>;
export declare const riderAvailabilitySchema: z.ZodObject<{
    status: z.ZodEnum<["online", "offline", "busy"]>;
}, "strip", z.ZodTypeAny, {
    status: "online" | "offline" | "busy";
}, {
    status: "online" | "offline" | "busy";
}>;
export declare const riderLocationSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    heading: z.ZodOptional<z.ZodNumber>;
    speed: z.ZodOptional<z.ZodNumber>;
    accuracy: z.ZodOptional<z.ZodNumber>;
    orderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    heading?: number | undefined;
    speed?: number | undefined;
    accuracy?: number | undefined;
    orderId?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    heading?: number | undefined;
    speed?: number | undefined;
    accuracy?: number | undefined;
    orderId?: string | undefined;
}>;
export declare const riderRejectSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const riderOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["picked", "in_transit", "delivered", "cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status: "picked" | "in_transit" | "delivered" | "cancelled";
}, {
    status: "picked" | "in_transit" | "delivered" | "cancelled";
}>;
export declare const deliveryProofSchema: z.ZodObject<{
    proofType: z.ZodDefault<z.ZodEnum<["photo", "signature", "otp"]>>;
    fileUrl: z.ZodString;
    otp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fileUrl: string;
    proofType: "photo" | "signature" | "otp";
    otp?: string | undefined;
}, {
    fileUrl: string;
    otp?: string | undefined;
    proofType?: "photo" | "signature" | "otp" | undefined;
}>;
export declare const acceptDeliverySchema: z.ZodObject<{
    orderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderId: string;
}, {
    orderId: string;
}>;
