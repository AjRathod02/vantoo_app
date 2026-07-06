import type { ServiceType } from "./common.js";
export type ProductStatus = "draft" | "active" | "inactive" | "out_of_stock" | "discontinued";
export interface CatalogProduct {
    id: string;
    legacyId: string | null;
    vendorId: string;
    storeId: string | null;
    categoryId: string | null;
    categoryName: string | null;
    brandId: string | null;
    brandName: string | null;
    name: string;
    slug: string;
    description: string;
    serviceType: ServiceType;
    status: ProductStatus;
    basePrice: number;
    compareAtPrice: number | null;
    taxRate: number;
    rating: number;
    reviewCount: number;
    image: string | null;
    unit: string | null;
    inStock: boolean;
    stockQuantity: number;
    variantId: string | null;
    sku: string | null;
    tags: string[];
}
export interface CatalogCategory {
    id: string;
    name: string;
    slug: string;
    serviceType: ServiceType | null;
    imageUrl: string | null;
    parentId: string | null;
}
export interface CustomerAddress {
    id: string;
    userId: string;
    label: string;
    recipientName: string;
    phone: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
}
export interface ProductListParams {
    service?: ServiceType;
    category?: string;
    q?: string;
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: "price-asc" | "price-desc" | "rating" | "newest";
    page?: number;
    limit?: number;
}
