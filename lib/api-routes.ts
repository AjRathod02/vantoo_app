/**
 * Central API route map for all Vantoo applications.
 * Customer web/mobile, vendor mobile, rider mobile, and admin web consume these endpoints.
 */
export const API = {
  auth: {
    login: "/api/auth/login",
    signup: "/api/auth/signup",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  },
  customer: {
    products: "/api/customer/products",
    product: (id: string) => `/api/customer/products/${id}`,
    orders: "/api/customer/orders",
    order: (id: string) => `/api/customer/orders/${id}`,
    cancelOrder: (id: string) => `/api/customer/orders/${id}/cancel`,
    trackOrder: (id: string) => `/api/customer/orders/${id}/tracking`,
    restaurants: "/api/customer/restaurants",
    offers: "/api/customer/offers",
    notifications: "/api/customer/notifications",
    payments: {
      createOrder: "/api/customer/payments/razorpay/create-order",
      verify: "/api/customer/payments/razorpay/verify",
    },
  },
  vendor: {
    me: "/api/vendor/me",
    apply: "/api/vendor/apply",
    documents: "/api/vendor/documents",
    stores: "/api/vendor/stores",
    products: "/api/vendor/products",
    orders: "/api/vendor/orders",
  },
  rider: {
    me: "/api/rider/me",
    apply: "/api/rider/apply",
    documents: "/api/rider/documents",
    availability: "/api/rider/availability",
    location: "/api/rider/location",
    deliveries: "/api/rider/deliveries",
    earnings: "/api/rider/earnings",
  },
  admin: {
    products: "/api/admin/products",
    product: (id: string) => `/api/admin/products/${id}`,
    orders: "/api/admin/orders",
    order: (id: string) => `/api/admin/orders/${id}`,
    vendors: "/api/admin/vendors",
    riders: "/api/admin/riders",
  },
} as const;
