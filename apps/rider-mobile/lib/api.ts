const API = {
  me: "/api/rider/me",
  apply: "/api/rider/apply",
  availability: "/api/rider/availability",
  deliveries: "/api/rider/deliveries",
  earnings: "/api/rider/earnings",
  location: "/api/rider/location",
};

export function apiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export { API };
