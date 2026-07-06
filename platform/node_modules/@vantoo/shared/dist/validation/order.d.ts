import { z } from "zod";
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }, {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }>, "many">;
    serviceType: z.ZodEnum<["food", "grocery", "medicine", "ecommerce", "local_shop"]>;
    deliveryType: z.ZodOptional<z.ZodEnum<["standard", "express", "scheduled", "pickup"]>>;
    address: z.ZodObject<{
        label: z.ZodString;
        recipientName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        landmark: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        pincode: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        isDefault: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        line1: string;
        city: string;
        pincode: string;
        phone?: string | undefined;
        recipientName?: string | undefined;
        line2?: string | undefined;
        landmark?: string | undefined;
        state?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        isDefault?: boolean | undefined;
    }, {
        label: string;
        line1: string;
        city: string;
        pincode: string;
        phone?: string | undefined;
        recipientName?: string | undefined;
        line2?: string | undefined;
        landmark?: string | undefined;
        state?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        isDefault?: boolean | undefined;
    }>;
    deliveryInstructions: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodEnum<["upi", "card", "netbanking", "wallet", "cod", "gift_card", "split"]>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["pending", "processing", "paid", "failed", "refunded", "partially_refunded"]>>;
    couponCode: z.ZodOptional<z.ZodString>;
    walletAmount: z.ZodOptional<z.ZodNumber>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    razorpayOrderId: z.ZodOptional<z.ZodString>;
    razorpayPaymentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }[];
    serviceType: "food" | "grocery" | "medicine" | "ecommerce" | "local_shop";
    address: {
        label: string;
        line1: string;
        city: string;
        pincode: string;
        phone?: string | undefined;
        recipientName?: string | undefined;
        line2?: string | undefined;
        landmark?: string | undefined;
        state?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        isDefault?: boolean | undefined;
    };
    paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "cod" | "gift_card" | "split";
    deliveryType?: "standard" | "express" | "scheduled" | "pickup" | undefined;
    deliveryInstructions?: string | undefined;
    paymentStatus?: "pending" | "refunded" | "processing" | "paid" | "failed" | "partially_refunded" | undefined;
    couponCode?: string | undefined;
    walletAmount?: number | undefined;
    idempotencyKey?: string | undefined;
    razorpayOrderId?: string | undefined;
    razorpayPaymentId?: string | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
        variantId?: string | undefined;
    }[];
    serviceType: "food" | "grocery" | "medicine" | "ecommerce" | "local_shop";
    address: {
        label: string;
        line1: string;
        city: string;
        pincode: string;
        phone?: string | undefined;
        recipientName?: string | undefined;
        line2?: string | undefined;
        landmark?: string | undefined;
        state?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
        isDefault?: boolean | undefined;
    };
    paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "cod" | "gift_card" | "split";
    deliveryType?: "standard" | "express" | "scheduled" | "pickup" | undefined;
    deliveryInstructions?: string | undefined;
    paymentStatus?: "pending" | "refunded" | "processing" | "paid" | "failed" | "partially_refunded" | undefined;
    couponCode?: string | undefined;
    walletAmount?: number | undefined;
    idempotencyKey?: string | undefined;
    razorpayOrderId?: string | undefined;
    razorpayPaymentId?: string | undefined;
}>;
export declare const cancelOrderSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
