/**
 * Expo location hook for rider-mobile.
 * Install: npx expo install expo-location
 *
 * Usage in rider app after login:
 *   useExpoLocationShare({ orderId, enabled: isOnline });
 */
export interface ExpoLocationShareOptions {
  orderId?: string;
  enabled?: boolean;
  intervalMs?: number;
  apiBase?: string;
}

export async function uploadDeviceLocation(
  apiBase: string,
  payload: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    orderId?: string;
    role?: string;
  },
  token?: string
) {
  await fetch(`${apiBase}/api/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-vantoo-portal": "rider",
    },
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
      role: payload.role ?? "rider",
      online: true,
    }),
  });
}
