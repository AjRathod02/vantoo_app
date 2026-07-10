import {
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
} from "lucide-react";
import type { PaymentMethod } from "@/lib/types";

export type CheckoutStep = "cart" | "address" | "payment" | "review" | "complete";

export const CHECKOUT_STEPS: { id: CheckoutStep; label: string; emoji: string }[] = [
  { id: "cart", label: "Cart", emoji: "🛒" },
  { id: "address", label: "Address", emoji: "📍" },
  { id: "payment", label: "Payment", emoji: "💳" },
  { id: "review", label: "Review", emoji: "📋" },
  { id: "complete", label: "Complete", emoji: "✅" },
];

export const paymentOptions: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}[] = [
  { id: "card", label: "Credit / Debit Card", desc: "Powered by Razorpay", icon: CreditCard },
  { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "netbanking", label: "Net Banking", desc: "All major banks", icon: Landmark },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when it arrives", icon: Banknote },
];

export function paymentMethodLabel(method: PaymentMethod): string {
  return paymentOptions.find((p) => p.id === method)?.label ?? method;
}

export function estimatedDeliveryLabel(service?: string): string {
  switch (service) {
    case "food":
      return "30–40 minutes";
    case "medicine":
      return "20–30 minutes";
    case "grocery":
      return "45–60 minutes";
    default:
      return "2–4 business days";
  }
}
