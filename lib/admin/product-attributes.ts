import type { ServiceType } from "@/lib/types";

export type ProductAttributeField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "date";
  placeholder?: string;
  options?: { value: string; label: string }[];
  unit?: string;
};

export const PRODUCT_CATEGORY_LABELS: Record<ServiceType, string> = {
  food: "Food",
  grocery: "Grocery",
  medicine: "Medicine",
  ecommerce: "E-commerce",
  local_shop: "Local Shop",
};

export const PRODUCT_CATEGORY_FIELDS: Record<ServiceType, ProductAttributeField[]> = {
  food: [
    { key: "ingredients", label: "Ingredients", type: "textarea", placeholder: "List ingredients..." },
    { key: "prepTimeMins", label: "Preparation Time", type: "number", unit: "mins", placeholder: "25" },
    { key: "calories", label: "Calories", type: "number", unit: "kcal", placeholder: "350" },
    {
      key: "spiceLevel",
      label: "Spice Level",
      type: "select",
      options: [
        { value: "none", label: "None" },
        { value: "mild", label: "Mild" },
        { value: "medium", label: "Medium" },
        { value: "hot", label: "Hot" },
        { value: "extra_hot", label: "Extra Hot" },
      ],
    },
    {
      key: "dietType",
      label: "Veg / Non-Veg",
      type: "select",
      options: [
        { value: "veg", label: "Veg" },
        { value: "non_veg", label: "Non-Veg" },
        { value: "egg", label: "Egg" },
        { value: "vegan", label: "Vegan" },
      ],
    },
    { key: "addons", label: "Add-ons", type: "textarea", placeholder: "Extra cheese, sauce..." },
  ],
  grocery: [
    { key: "weight", label: "Weight", type: "text", placeholder: "500g" },
    { key: "brand", label: "Brand", type: "text", placeholder: "Brand name" },
    {
      key: "unit",
      label: "Unit",
      type: "select",
      options: [
        { value: "kg", label: "kg" },
        { value: "g", label: "g" },
        { value: "L", label: "L" },
        { value: "ml", label: "ml" },
        { value: "pack", label: "Pack" },
        { value: "piece", label: "Piece" },
      ],
    },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
    {
      key: "storageInstructions",
      label: "Storage Instructions",
      type: "textarea",
      placeholder: "Store in a cool, dry place",
    },
  ],
  medicine: [
    { key: "genericName", label: "Generic Name", type: "text", placeholder: "Paracetamol" },
    { key: "manufacturer", label: "Manufacturer", type: "text", placeholder: "Pharma Co." },
    { key: "prescriptionRequired", label: "Prescription Required", type: "checkbox" },
    { key: "dosage", label: "Dosage", type: "text", placeholder: "500mg" },
    { key: "composition", label: "Composition", type: "textarea", placeholder: "Active ingredients..." },
    { key: "expiryDate", label: "Expiry Date", type: "date" },
  ],
  ecommerce: [
    { key: "brand", label: "Brand", type: "text", placeholder: "Brand name" },
    { key: "model", label: "Model", type: "text", placeholder: "Model number" },
    { key: "color", label: "Color", type: "text", placeholder: "Black" },
    { key: "size", label: "Size", type: "text", placeholder: "M / 42 / 128GB" },
    { key: "warranty", label: "Warranty", type: "text", placeholder: "1 year" },
    { key: "specifications", label: "Specifications", type: "textarea", placeholder: "Key specs..." },
  ],
  local_shop: [
    { key: "brand", label: "Brand", type: "text", placeholder: "Brand / maker" },
    { key: "weight", label: "Weight / Size", type: "text", placeholder: "Size or weight" },
    { key: "specifications", label: "Details", type: "textarea", placeholder: "Product details..." },
  ],
};

export const MEDIA_SPECS = {
  image: {
    aspectRatio: "1:1",
    recommendedSize: "1080 × 1080 px",
    formats: ["JPG", "PNG", "WebP"],
    maxSizeMb: 5,
    accept: "image/jpeg,image/png,image/webp",
  },
  video: {
    aspectRatio: "16:9",
    recommendedSize: "1080p",
    formats: ["MP4"],
    maxSizeMb: 50,
    accept: "video/mp4",
  },
} as const;
