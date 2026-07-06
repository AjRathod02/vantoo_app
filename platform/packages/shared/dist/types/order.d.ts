import type { ServiceType } from "./common.js";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "packed" | "assigned" | "picked" | "in_transit" | "delivered" | "cancelled" | "returned" | "refunded" | "exchanged";
export type DeliveryType = "standard" | "express" | "scheduled" | "pickup";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cod" | "gift_card" | "split";
export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded" | "partially_refunded";
export interface OrderItem {
    id?: string;
    productId: string;
    variantId?: string;
    name: string;
    variantName?: string;
    sku?: string;
    image: string;
    price: number;
    quantity: number;
    totalPrice?: number;
}
export interface OrderAddress {
    id?: string;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    pincode: string;
    phone?: string;
    recipientName?: string;
    isDefault?: boolean;
}
export interface OrderTracking {
    riderName?: string;
    riderPhone?: string;
    riderLat?: number;
    riderLng?: number;
}
export interface OrderStatusHistoryEntry {
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string;
    createdAt: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    storeId: string | null;
    vendorId: string | null;
    serviceType: ServiceType;
    status: OrderStatus;
    deliveryType: DeliveryType;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    packagingFee: number;
    taxAmount: number;
    discountAmount: number;
    walletAmount: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod | null;
    couponCode: string | null;
    address: OrderAddress;
    deliveryInstructions?: string;
    estimatedDelivery: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
    placedAt: string;
    tracking?: OrderTracking;
    statusHistory?: OrderStatusHistoryEntry[];
}
export interface CreateOrderInput {
    items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
    }>;
    serviceType: ServiceType;
    deliveryType?: DeliveryType;
    address: OrderAddress;
    deliveryInstructions?: string;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    couponCode?: string;
    walletAmount?: number;
    idempotencyKey?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
}
