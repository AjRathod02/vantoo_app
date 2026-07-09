import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  transpilePackages: [
    "framer-motion",
    "leaflet",
    "react-leaflet",
    "embla-carousel",
    "embla-carousel-react",
    "embla-carousel-reactive-utils",
  ],
  async rewrites() {
    return [
      { source: "/api/customer/products", destination: "/api/products" },
      { source: "/api/customer/products/:id", destination: "/api/products/:id" },
      { source: "/api/customer/orders", destination: "/api/orders" },
      { source: "/api/customer/orders/:id", destination: "/api/orders/:id" },
      { source: "/api/customer/orders/:id/cancel", destination: "/api/orders/:id/cancel" },
      { source: "/api/customer/orders/:id/tracking", destination: "/api/orders/:id/tracking" },
      { source: "/api/customer/restaurants", destination: "/api/restaurants" },
      { source: "/api/customer/offers", destination: "/api/offers" },
      { source: "/api/customer/notifications", destination: "/api/notifications" },
      {
        source: "/api/customer/payments/razorpay/create-order",
        destination: "/api/payments/razorpay/create-order",
      },
      {
        source: "/api/customer/payments/razorpay/verify",
        destination: "/api/payments/razorpay/verify",
      },
    ];
  },
};

export default withPWA(nextConfig);
