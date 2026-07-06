import { z } from "zod";

export const productListQuerySchema = z.object({
  service: z.enum(["food", "grocery", "medicine", "ecommerce", "local_shop"]).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  brands: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  sort: z.enum(["price-asc", "price-desc", "rating", "newest"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  recipientName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  pincode: z.string().min(4).max(10),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
