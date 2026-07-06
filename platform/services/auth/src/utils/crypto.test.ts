import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashToken,
  parseDuration,
  isEmail,
  isPhone,
} from "./crypto.js";

describe("crypto utils", () => {
  it("generates 6-digit OTP", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("hashes tokens consistently", () => {
    const hash1 = hashToken("test-token");
    const hash2 = hashToken("test-token");
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe("test-token");
  });

  it("parses duration strings", () => {
    expect(parseDuration("15m")).toBe(900);
    expect(parseDuration("30d")).toBe(2592000);
    expect(parseDuration("1h")).toBe(3600);
  });

  it("validates email format", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("invalid")).toBe(false);
  });

  it("validates phone format", () => {
    expect(isPhone("+919876543210")).toBe(true);
    expect(isPhone("123")).toBe(false);
  });
});
