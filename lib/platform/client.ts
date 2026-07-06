const DEFAULTS = {
  catalog: "http://localhost:4002",
  order: "http://localhost:4003",
  notification: "http://localhost:4009",
  auth: "http://localhost:4001",
  vendor: "http://localhost:4004",
  rider: "http://localhost:4005",
  tracking: "http://localhost:4010",
};

export function isPlatformEnabled(): boolean {
  return process.env.PLATFORM_ENABLED === "true";
}

export function getServiceUrl(service: keyof typeof DEFAULTS): string {
  const envMap: Record<keyof typeof DEFAULTS, string | undefined> = {
    catalog: process.env.CATALOG_SERVICE_URL,
    order: process.env.ORDER_SERVICE_URL,
    notification: process.env.NOTIFICATION_SERVICE_URL,
    auth: process.env.AUTH_SERVICE_URL,
    vendor: process.env.VENDOR_SERVICE_URL,
    rider: process.env.RIDER_SERVICE_URL,
    tracking: process.env.TRACKING_SERVICE_URL,
  };
  return envMap[service] ?? DEFAULTS[service];
}

export function getInternalKey(): string {
  return process.env.INTERNAL_SERVICE_KEY ?? "dev_internal_key_change_in_production";
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
}

export async function serviceFetch<T>(
  service: keyof typeof DEFAULTS,
  path: string,
  options: RequestInit & { userId?: string } = {}
): Promise<T> {
  const { userId, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Internal-Key": getInternalKey(),
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (userId) headers["X-User-Id"] = userId;

  const res = await fetch(`${getServiceUrl(service)}${path}`, {
    ...fetchOptions,
    headers,
    cache: "no-store",
  });

  const body = (await res.json()) as ServiceResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? `Service error: ${res.status}`);
  }
  return body.data as T;
}
