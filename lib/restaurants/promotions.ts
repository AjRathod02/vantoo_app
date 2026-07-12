import { restaurants } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/types";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export interface FlashOffer {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  subtitle: string;
  offerType: string;
  badgeText: string;
  startsAt: string;
  endsAt: string;
}

export interface SponsoredListing {
  restaurantId: string;
  restaurantName: string;
  endsAt: string;
}

const SEED_SPONSORS: SponsoredListing[] = [
  { restaurantId: "r-1", restaurantName: "Pizza Palace", endsAt: new Date(Date.now() + 6 * 864e5).toISOString() },
  { restaurantId: "r-3", restaurantName: "Biryani House", endsAt: new Date(Date.now() + 13 * 864e5).toISOString() },
  { restaurantId: "r-10", restaurantName: "Sushi Zen", endsAt: new Date(Date.now() + 5 * 864e5).toISOString() },
];

const SEED_OFFERS: FlashOffer[] = [
  {
    id: "fo1",
    restaurantId: "r-1",
    restaurantName: "Pizza Palace",
    title: "20% OFF Today",
    subtitle: "On all pizzas above ₹299",
    offerType: "percent_off",
    badgeText: "20% OFF Today",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 8 * 3600e3).toISOString(),
  },
  {
    id: "fo2",
    restaurantId: "r-2",
    restaurantName: "Burger Hub",
    title: "Buy 1 Get 1 Free",
    subtitle: "Selected burgers only",
    offerType: "bogo",
    badgeText: "BOGO",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 12 * 3600e3).toISOString(),
  },
  {
    id: "fo3",
    restaurantId: "r-5",
    restaurantName: "Green Bowl",
    title: "Free Delivery",
    subtitle: "No delivery fee on bowls",
    offerType: "free_delivery",
    badgeText: "Free Delivery",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 6 * 3600e3).toISOString(),
  },
  {
    id: "fo4",
    restaurantId: "r-6",
    restaurantName: "Spice Route",
    title: "Happy Hour",
    subtitle: "15% off 4–7 PM",
    offerType: "happy_hour",
    badgeText: "Happy Hour",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 3 * 3600e3).toISOString(),
  },
  {
    id: "fo5",
    restaurantId: "r-11",
    restaurantName: "Dosa Corner",
    title: "Lunch Combo",
    subtitle: "Dosa + chutney meal deal",
    offerType: "lunch_combo",
    badgeText: "Lunch Combo",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 5 * 3600e3).toISOString(),
  },
];

export async function getActiveSponsorships(): Promise<SponsoredListing[]> {
  if (hasAdminClient()) {
    try {
      const now = new Date().toISOString();
      const { data } = await createAdminClient()
        .from("restaurant_sponsorships")
        .select("restaurant_id, restaurant_name, ends_at")
        .eq("status", "active")
        .lte("starts_at", now)
        .gte("ends_at", now);
      if (data?.length) {
        return data.map((r) => ({
          restaurantId: r.restaurant_id,
          restaurantName: r.restaurant_name,
          endsAt: r.ends_at,
        }));
      }
    } catch (e) {
      console.error("getActiveSponsorships:", e);
    }
  }
  return SEED_SPONSORS;
}

export async function getActiveFlashOffers(
  restaurantId?: string
): Promise<FlashOffer[]> {
  if (hasAdminClient()) {
    try {
      const now = new Date().toISOString();
      let q = createAdminClient()
        .from("restaurant_flash_offers")
        .select("*")
        .eq("is_active", true)
        .gte("ends_at", now)
        .order("ends_at");
      if (restaurantId) q = q.eq("restaurant_id", restaurantId);
      const { data } = await q;
      if (data?.length) {
        return data.map((o) => ({
          id: o.id,
          restaurantId: o.restaurant_id,
          restaurantName: o.restaurant_name,
          title: o.title,
          subtitle: o.subtitle ?? "",
          offerType: o.offer_type,
          badgeText: o.badge_text,
          startsAt: o.starts_at,
          endsAt: o.ends_at,
        }));
      }
    } catch (e) {
      console.error("getActiveFlashOffers:", e);
    }
  }
  const now = Date.now();
  return SEED_OFFERS.filter(
    (o) =>
      new Date(o.endsAt).getTime() > now &&
      (!restaurantId || o.restaurantId === restaurantId)
  );
}

export async function getSponsoredRestaurants(): Promise<
  Array<Restaurant & { sponsored: true; flashOffer?: FlashOffer }>
> {
  const [sponsors, offers] = await Promise.all([
    getActiveSponsorships(),
    getActiveFlashOffers(),
  ]);
  const offerMap = new Map(offers.map((o) => [o.restaurantId, o]));

  return sponsors
    .map((s) => {
      const base = restaurants.find((r) => r.id === s.restaurantId);
      if (!base) return null;
      return {
        ...base,
        sponsored: true as const,
        promoted: true,
        offer: offerMap.get(s.restaurantId)?.badgeText ?? base.offer,
        flashOffer: offerMap.get(s.restaurantId),
      };
    })
    .filter(Boolean) as Array<
    Restaurant & { sponsored: true; flashOffer?: FlashOffer }
  >;
}

export async function enrichRestaurants(
  list: Restaurant[]
): Promise<Array<Restaurant & { sponsored?: boolean; flashOffer?: FlashOffer }>> {
  const [sponsors, offers] = await Promise.all([
    getActiveSponsorships(),
    getActiveFlashOffers(),
  ]);
  const sponsorIds = new Set(sponsors.map((s) => s.restaurantId));
  const offerMap = new Map(offers.map((o) => [o.restaurantId, o]));

  return list.map((r) => ({
    ...r,
    sponsored: sponsorIds.has(r.id),
    promoted: sponsorIds.has(r.id) || r.promoted,
    offer: offerMap.get(r.id)?.badgeText ?? r.offer,
    flashOffer: offerMap.get(r.id),
  }));
}
