export type ServiceType = "food" | "grocery" | "medicine" | "ecommerce";

export interface Product {
  id: string;
  name: string;
  description: string;
  service: ServiceType;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  vendorId?: string;
  unit?: string;
  inStock: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  reviews: number;
  deliveryTime: string;
  priceForTwo: number;
  image: string;
  offer?: string;
  promoted?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  service: ServiceType | "all";
  color: "orange" | "red" | "green";
  image: string;
}

export interface Category {
  id: string;
  name: string;
  service: ServiceType;
  icon: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

export type PaymentMethod = "card" | "netbanking" | "upi" | "cod";

export type OrderStatus =
  | "confirmed"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  address: Address;
  placedAt: string;
  cancelledAt?: string;
  service: ServiceType;
  tracking?: OrderTracking;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role?: "customer" | "admin";
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type RefundStatus = "none" | "requested" | "processing" | "completed";

export interface OrderTracking {
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
}
