declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

export type RazorpayMethodConfig = {
  card?: boolean;
  upi?: boolean;
  netbanking?: boolean;
  wallet?: boolean;
};

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  method?: RazorpayMethodConfig;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

export function razorpayMethodForPayment(
  payment: "card" | "upi" | "netbanking"
): RazorpayMethodConfig {
  return {
    card: payment === "card",
    upi: payment === "upi",
    netbanking: payment === "netbanking",
    wallet: false,
  };
}

export function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: RazorpayOptions) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Failed to load Razorpay");
  }
  const rzp = new window.Razorpay(options);
  rzp.open();
  return rzp;
}
