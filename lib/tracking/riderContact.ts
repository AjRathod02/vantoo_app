export function normalizeIndianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length >= 10) return digits;
  return null;
}

export function buildRiderCallUrl(phone: string): string | null {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return null;
  return `tel:+${normalized}`;
}

export function buildRiderMessageUrl(
  phone: string,
  orderId: string,
  riderName?: string
): string | null {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return null;
  const greeting = riderName ? `Hi ${riderName}` : "Hi";
  const text = `${greeting}, I have a question about my order #${orderId} from Vantoo.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
