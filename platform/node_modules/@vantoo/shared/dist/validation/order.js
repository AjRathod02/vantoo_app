import { z } from "zod";
import { addressSchema } from "./catalog.js";
export const createOrderSchema = z.object({
    items: z
        .array(z.object({
        productId: z.string().min(1),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().min(1).max(99),
    }))
        .min(1),
    serviceType: z.enum(["food", "grocery", "medicine", "ecommerce", "local_shop"]),
    deliveryType: z.enum(["standard", "express", "scheduled", "pickup"]).optional(),
    address: addressSchema,
    deliveryInstructions: z.string().max(500).optional(),
    paymentMethod: z.enum(["upi", "card", "netbanking", "wallet", "cod", "gift_card", "split"]),
    paymentStatus: z.enum(["pending", "processing", "paid", "failed", "refunded", "partially_refunded"]).optional(),
    couponCode: z.string().max(50).optional(),
    walletAmount: z.number().min(0).optional(),
    idempotencyKey: z.string().max(128).optional(),
    razorpayOrderId: z.string().optional(),
    razorpayPaymentId: z.string().optional(),
});
export const cancelOrderSchema = z.object({
    reason: z.string().max(500).optional(),
});
