import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number }
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    const [algo, salt, stored] = hash.split(":");
    if (algo !== "scrypt" || !salt || !stored) return false;
    const derived = await scryptAsync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    const storedBuf = Buffer.from(stored, "hex");
    if (derived.length !== storedBuf.length) return false;
    return timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function generateOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i]! % 10];
  }
  return otp;
}

export function parseUserAgent(ua: string | null): { browser: string; platform: string; device: string } {
  if (!ua) return { browser: "Unknown", platform: "web", device: "Unknown Device" };

  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  let platform = "web";
  if (ua.includes("Mobile") || ua.includes("Android")) platform = "mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) platform = "tablet";

  const device = platform === "mobile" ? "Mobile Device" : platform === "tablet" ? "Tablet" : "Desktop";

  return { browser, platform, device };
}
