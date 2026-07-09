const API = {
  me: "/api/vendor/me",
  apply: "/api/vendor/apply",
  orders: "/api/vendor/orders",
  products: "/api/vendor/products",
  stores: "/api/vendor/stores",
};

export function apiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export { API };
