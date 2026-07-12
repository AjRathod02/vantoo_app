import type { Category } from "@/lib/types";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export const categories: Category[] = [
  { id: "c-pizza", name: "Pizza", service: "food", icon: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" },
  { id: "c-burger", name: "Burgers", service: "food", icon: "Beef", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { id: "c-biryani", name: "Biryani", service: "food", icon: "UtensilsCrossed", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80" },
  { id: "c-dessert", name: "Desserts", service: "food", icon: "IceCream", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80" },
  { id: "c-drinks", name: "Beverages", service: "food", icon: "CupSoda", image: "https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80" },

  { id: "c-fruits", name: "Fruits", service: "grocery", icon: "Apple", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80" },
  { id: "c-vegetables", name: "Vegetables", service: "grocery", icon: "Carrot", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80" },
  { id: "c-dairy", name: "Dairy", service: "grocery", icon: "Milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80" },
  { id: "c-snacks", name: "Snacks", service: "grocery", icon: "Cookie", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80" },

  { id: "c-painrelief", name: "Pain Relief", service: "medicine", icon: "Pill", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" },
  { id: "c-vitamins", name: "Vitamins", service: "medicine", icon: "Tablets", image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&q=80" },
  { id: "c-firstaid", name: "First Aid", service: "medicine", icon: "BriefcaseMedical", image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80" },

  { id: "c-fashion", name: "Fashion", service: "ecommerce", icon: "Shirt", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80" },
  { id: "c-footwear", name: "Footwear", service: "ecommerce", icon: "Footprints", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: "c-electronics", name: "Electronics", service: "ecommerce", icon: "Smartphone", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80" },
  { id: "c-home", name: "Home", service: "ecommerce", icon: "Lamp", image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80" },
];

/** Active categories from DB with static catalog fallback. */
export async function getCategories(service?: string): Promise<Category[]> {
  if (hasAdminClient()) {
    try {
      let q = createAdminClient()
        .from("product_categories")
        .select("id, name, service, icon, image")
        .eq("is_active", true)
        .order("sort_order");
      if (service) q = q.eq("service", service);
      const { data, error } = await q;
      if (!error && data?.length) {
        return data.map((row) => ({
          id: row.id,
          name: row.name,
          service: row.service,
          icon: row.icon,
          image: row.image,
        }));
      }
    } catch (e) {
      console.error("getCategories:", e);
    }
  }

  return service
    ? categories.filter((c) => c.service === service)
    : categories;
}
