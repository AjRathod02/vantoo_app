import { z } from "zod";
export declare const vendorApplySchema: z.ZodObject<{
    businessName: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    contactEmail: z.ZodString;
    contactPhone: z.ZodString;
    gstNumber: z.ZodOptional<z.ZodString>;
    panNumber: z.ZodOptional<z.ZodString>;
    storeType: z.ZodEnum<["restaurant", "grocery", "pharmacy", "ecommerce", "local_shop"]>;
    storeName: z.ZodString;
    addressLine1: z.ZodString;
    city: z.ZodString;
    pincode: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    contactEmail: string;
    contactPhone: string;
    storeType: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop";
    storeName: string;
    addressLine1: string;
    city: string;
    pincode: string;
    legalName?: string | undefined;
    description?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
    state?: string | undefined;
}, {
    businessName: string;
    contactEmail: string;
    contactPhone: string;
    storeType: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop";
    storeName: string;
    addressLine1: string;
    city: string;
    pincode: string;
    legalName?: string | undefined;
    description?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
    state?: string | undefined;
}>;
export declare const vendorUpdateSchema: z.ZodObject<{
    businessName: z.ZodOptional<z.ZodString>;
    legalName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    contactEmail: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodString>;
    gstNumber: z.ZodOptional<z.ZodString>;
    panNumber: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    bankAccount: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    businessName?: string | undefined;
    legalName?: string | undefined;
    description?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
    logoUrl?: string | undefined;
    bankAccount?: Record<string, unknown> | undefined;
}, {
    businessName?: string | undefined;
    legalName?: string | undefined;
    description?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
    gstNumber?: string | undefined;
    panNumber?: string | undefined;
    logoUrl?: string | undefined;
    bankAccount?: Record<string, unknown> | undefined;
}>;
export declare const documentUploadSchema: z.ZodObject<{
    documentType: z.ZodEnum<["pan", "gst", "fssai", "drug_license", "bank_proof", "identity", "address_proof", "other"]>;
    documentNumber: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    documentType: "pan" | "gst" | "fssai" | "drug_license" | "bank_proof" | "identity" | "address_proof" | "other";
    fileUrl: string;
    documentNumber?: string | undefined;
    expiresAt?: string | undefined;
}, {
    documentType: "pan" | "gst" | "fssai" | "drug_license" | "bank_proof" | "identity" | "address_proof" | "other";
    fileUrl: string;
    documentNumber?: string | undefined;
    expiresAt?: string | undefined;
}>;
export declare const storeCreateSchema: z.ZodObject<{
    name: z.ZodString;
    storeType: z.ZodEnum<["restaurant", "grocery", "pharmacy", "ecommerce", "local_shop"]>;
    serviceTypes: z.ZodArray<z.ZodEnum<["food", "grocery", "medicine", "ecommerce", "local_shop"]>, "many">;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    pincode: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    deliveryRadiusKm: z.ZodOptional<z.ZodNumber>;
    minOrderAmount: z.ZodOptional<z.ZodNumber>;
    avgDeliveryMins: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    storeType: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop";
    addressLine1: string;
    city: string;
    pincode: string;
    name: string;
    serviceTypes: ("grocery" | "ecommerce" | "local_shop" | "food" | "medicine")[];
    description?: string | undefined;
    state?: string | undefined;
    imageUrl?: string | undefined;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    deliveryRadiusKm?: number | undefined;
    minOrderAmount?: number | undefined;
    avgDeliveryMins?: number | undefined;
}, {
    storeType: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop";
    addressLine1: string;
    city: string;
    pincode: string;
    name: string;
    serviceTypes: ("grocery" | "ecommerce" | "local_shop" | "food" | "medicine")[];
    description?: string | undefined;
    state?: string | undefined;
    imageUrl?: string | undefined;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    deliveryRadiusKm?: number | undefined;
    minOrderAmount?: number | undefined;
    avgDeliveryMins?: number | undefined;
}>;
export declare const storeUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    storeType: z.ZodOptional<z.ZodEnum<["restaurant", "grocery", "pharmacy", "ecommerce", "local_shop"]>>;
    serviceTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["food", "grocery", "medicine", "ecommerce", "local_shop"]>, "many">>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    addressLine1: z.ZodOptional<z.ZodString>;
    addressLine2: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pincode: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    deliveryRadiusKm: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    minOrderAmount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    avgDeliveryMins: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    storeType?: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop" | undefined;
    addressLine1?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    state?: string | undefined;
    name?: string | undefined;
    serviceTypes?: ("grocery" | "ecommerce" | "local_shop" | "food" | "medicine")[] | undefined;
    imageUrl?: string | undefined;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    deliveryRadiusKm?: number | undefined;
    minOrderAmount?: number | undefined;
    avgDeliveryMins?: number | undefined;
}, {
    description?: string | undefined;
    storeType?: "restaurant" | "grocery" | "pharmacy" | "ecommerce" | "local_shop" | undefined;
    addressLine1?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    state?: string | undefined;
    name?: string | undefined;
    serviceTypes?: ("grocery" | "ecommerce" | "local_shop" | "food" | "medicine")[] | undefined;
    imageUrl?: string | undefined;
    addressLine2?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    deliveryRadiusKm?: number | undefined;
    minOrderAmount?: number | undefined;
    avgDeliveryMins?: number | undefined;
}>;
export declare const storeTimingSchema: z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    openTime: z.ZodString;
    closeTime: z.ZodString;
    isClosed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed?: boolean | undefined;
}, {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed?: boolean | undefined;
}>;
export declare const vendorProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    serviceType: z.ZodEnum<["food", "grocery", "medicine", "ecommerce", "local_shop"]>;
    categoryName: z.ZodOptional<z.ZodString>;
    brandName: z.ZodOptional<z.ZodString>;
    basePrice: z.ZodNumber;
    compareAtPrice: z.ZodOptional<z.ZodNumber>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    storeId: z.ZodOptional<z.ZodString>;
    initialStock: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    serviceType: "grocery" | "ecommerce" | "local_shop" | "food" | "medicine";
    basePrice: number;
    initialStock: number;
    description?: string | undefined;
    imageUrl?: string | undefined;
    categoryName?: string | undefined;
    brandName?: string | undefined;
    compareAtPrice?: number | undefined;
    taxRate?: number | undefined;
    unit?: string | undefined;
    storeId?: string | undefined;
}, {
    name: string;
    serviceType: "grocery" | "ecommerce" | "local_shop" | "food" | "medicine";
    basePrice: number;
    description?: string | undefined;
    imageUrl?: string | undefined;
    categoryName?: string | undefined;
    brandName?: string | undefined;
    compareAtPrice?: number | undefined;
    taxRate?: number | undefined;
    unit?: string | undefined;
    storeId?: string | undefined;
    initialStock?: number | undefined;
}>;
export declare const vendorProductUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    serviceType: z.ZodOptional<z.ZodEnum<["food", "grocery", "medicine", "ecommerce", "local_shop"]>>;
    categoryName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    brandName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    basePrice: z.ZodOptional<z.ZodNumber>;
    compareAtPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    taxRate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    storeId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    initialStock: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
    imageUrl?: string | undefined;
    serviceType?: "grocery" | "ecommerce" | "local_shop" | "food" | "medicine" | undefined;
    categoryName?: string | undefined;
    brandName?: string | undefined;
    basePrice?: number | undefined;
    compareAtPrice?: number | undefined;
    taxRate?: number | undefined;
    unit?: string | undefined;
    storeId?: string | undefined;
    initialStock?: number | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
    imageUrl?: string | undefined;
    serviceType?: "grocery" | "ecommerce" | "local_shop" | "food" | "medicine" | undefined;
    categoryName?: string | undefined;
    brandName?: string | undefined;
    basePrice?: number | undefined;
    compareAtPrice?: number | undefined;
    taxRate?: number | undefined;
    unit?: string | undefined;
    storeId?: string | undefined;
    initialStock?: number | undefined;
}>;
export declare const vendorRejectSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const vendorOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["confirmed", "preparing", "packed", "cancelled"]>;
}, "strip", z.ZodTypeAny, {
    status: "cancelled" | "confirmed" | "preparing" | "packed";
}, {
    status: "cancelled" | "confirmed" | "preparing" | "packed";
}>;
