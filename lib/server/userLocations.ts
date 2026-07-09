import type { DeviceLocation, LocationRole, UserLocationRecord } from "@/lib/types";
import { publishUserLocation } from "@/lib/tracking/broadcaster";
import { hasAdminClient, createAdminClient } from "@/utils/supabase/admin";

const globalForLocations = globalThis as unknown as {
  vantooUserLocations?: Map<string, UserLocationRecord>;
};

const locations =
  globalForLocations.vantooUserLocations ?? new Map<string, UserLocationRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForLocations.vantooUserLocations = locations;
}

const STALE_MS = 5 * 60 * 1000;

export function upsertUserLocation(
  record: Omit<UserLocationRecord, "updatedAt"> & { updatedAt?: string }
): UserLocationRecord {
  const updated: UserLocationRecord = {
    ...record,
    online: record.online ?? true,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  };

  locations.set(record.userId, updated);
  publishUserLocation(updated);

  if (hasAdminClient()) {
    persistLocation(updated).catch(() => undefined);
  }

  return updated;
}

async function persistLocation(record: UserLocationRecord) {
  const supabase = createAdminClient();
  await supabase.from("user_locations").upsert({
    user_id: record.userId,
    role: record.role,
    latitude: record.latitude,
    longitude: record.longitude,
    accuracy: record.accuracy ?? null,
    speed: record.speed ?? null,
    heading: record.heading ?? null,
    altitude: record.altitude ?? null,
    online: record.online ?? true,
    order_id: record.orderId ?? null,
    city: record.city ?? null,
    updated_at: record.updatedAt,
  });

  if (record.orderId) {
    await supabase.from("user_location_history").insert({
      user_id: record.userId,
      role: record.role,
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.accuracy ?? null,
      speed: record.speed ?? null,
      heading: record.heading ?? null,
      order_id: record.orderId,
      recorded_at: record.updatedAt,
    });
  }
}

export function getUserLocation(userId: string): UserLocationRecord | null {
  const record = locations.get(userId);
  if (!record) return null;
  if (Date.now() - new Date(record.updatedAt).getTime() > STALE_MS) {
    return { ...record, online: false };
  }
  return record;
}

export function listUserLocations(filters?: {
  role?: LocationRole;
  online?: boolean;
  orderId?: string;
  city?: string;
}): UserLocationRecord[] {
  const now = Date.now();
  return Array.from(locations.values())
    .filter((r) => {
      if (filters?.role && r.role !== filters.role) return false;
      if (filters?.city && r.city !== filters.city) return false;
      if (filters?.orderId && r.orderId !== filters.orderId) return false;
      const isOnline =
        r.online !== false &&
        now - new Date(r.updatedAt).getTime() <= STALE_MS;
      if (filters?.online === true && !isOnline) return false;
      if (filters?.online === false && isOnline) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function loadLocationsFromDb(): Promise<void> {
  if (!hasAdminClient()) return;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_locations")
      .select("*")
      .gte(
        "updated_at",
        new Date(Date.now() - STALE_MS).toISOString()
      );

    for (const row of data ?? []) {
      locations.set(row.user_id, {
        userId: row.user_id,
        role: row.role as LocationRole,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        accuracy: row.accuracy ? Number(row.accuracy) : undefined,
        speed: row.speed ? Number(row.speed) : undefined,
        heading: row.heading ? Number(row.heading) : undefined,
        altitude: row.altitude ? Number(row.altitude) : undefined,
        online: row.online ?? true,
        orderId: row.order_id ?? undefined,
        city: row.city ?? undefined,
        timestamp: row.updated_at,
        updatedAt: row.updated_at,
      });
    }
  } catch {
    // memory-only fallback
  }
}

export function deviceToRecord(
  userId: string,
  role: LocationRole,
  device: DeviceLocation,
  extra?: Partial<UserLocationRecord>
): UserLocationRecord {
  return {
    userId,
    role,
    latitude: device.latitude,
    longitude: device.longitude,
    accuracy: device.accuracy,
    speed: device.speed,
    heading: device.heading,
    altitude: device.altitude,
    timestamp: device.timestamp,
    updatedAt: device.timestamp,
    ...extra,
  };
}
