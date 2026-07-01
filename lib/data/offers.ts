import type { Offer } from "@/lib/types";

export const offers: Offer[] = [
  {
    id: "o-1",
    title: "Delicious Food Delivered Fast!",
    subtitle: "Order from your favourite restaurants",
    discount: "50% OFF",
    service: "food",
    color: "orange",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80",
  },
  {
    id: "o-2",
    title: "Fresh Groceries to Your Door",
    subtitle: "Farm fresh produce every day",
    discount: "20% OFF",
    service: "grocery",
    color: "green",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
  },
  {
    id: "o-3",
    title: "Medicines in Minutes",
    subtitle: "Verified pharmacies near you",
    discount: "48% OFF",
    service: "medicine",
    color: "red",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
  },
  {
    id: "o-4",
    title: "Trending Fashion & More",
    subtitle: "Shop the latest styles",
    discount: "FLAT 30% OFF",
    service: "ecommerce",
    color: "orange",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80",
  },
];
