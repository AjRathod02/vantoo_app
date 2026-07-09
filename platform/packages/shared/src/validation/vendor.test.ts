import { describe, it, expect } from "vitest";
import {
  vendorApplySchema,
  documentUploadSchema,
  vendorProductSchema,
} from "./vendor.js";

const validApply = {
  businessName: "Test Kitchen",
  contactEmail: "vendor@example.com",
  contactPhone: "+919876543210",
  storeType: "restaurant" as const,
  storeName: "Test Store",
  addressLine1: "12 MG Road",
  city: "Bangalore",
  pincode: "560001",
};

describe("vendor validation schemas", () => {
  it("validates vendor application input", () => {
    expect(vendorApplySchema.safeParse(validApply).success).toBe(true);
  });

  it("rejects invalid contact phone", () => {
    const result = vendorApplySchema.safeParse({
      ...validApply,
      contactPhone: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("validates document upload input", () => {
    const result = documentUploadSchema.safeParse({
      documentType: "pan",
      fileUrl: "https://example.com/pan.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("rejects document upload without file URL", () => {
    const result = documentUploadSchema.safeParse({
      documentType: "pan",
      fileUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("validates vendor product input", () => {
    const result = vendorProductSchema.safeParse({
      name: "Margherita Pizza",
      serviceType: "food",
      basePrice: 299,
      initialStock: 10,
    });
    expect(result.success).toBe(true);
  });
});
