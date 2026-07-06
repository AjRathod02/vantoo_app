import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
} from "@vantoo/shared";

describe("auth validation schemas", () => {
  it("validates registration input", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass123",
      firstName: "John",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      firstName: "John",
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("validates OTP send input", () => {
    const result = otpSendSchema.safeParse({
      identifier: "+919876543210",
      channel: "sms",
      purpose: "login",
    });
    expect(result.success).toBe(true);
  });

  it("validates OTP verify input", () => {
    const result = otpVerifySchema.safeParse({
      identifier: "+919876543210",
      otp: "123456",
      purpose: "login",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid OTP format", () => {
    const result = otpVerifySchema.safeParse({
      identifier: "+919876543210",
      otp: "12345",
      purpose: "login",
    });
    expect(result.success).toBe(false);
  });
});
