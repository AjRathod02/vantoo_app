import { NextResponse } from "next/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

const FALLBACK_CODES: Record<string, number> = {
  SAVE10: 0.1,
  VANTOO20: 0.2,
};

function calcDiscount(
  type: "percent" | "fixed",
  value: number,
  subtotal: number,
  maxDiscount: number | null
) {
  let discount =
    type === "percent"
      ? Math.round((subtotal * value) / 100)
      : Math.round(value);
  if (maxDiscount != null && maxDiscount > 0) {
    discount = Math.min(discount, Math.round(maxDiscount));
  }
  return Math.max(0, Math.min(discount, Math.round(subtotal)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal ?? 0);
    const service = body.service ? String(body.service) : null;

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (hasAdminClient()) {
      try {
        const { data: coupon, error } = await createAdminClient()
          .from("coupons")
          .select("*")
          .eq("code", code)
          .maybeSingle();

        if (!error && coupon) {
          const now = Date.now();
          if (!coupon.is_active) {
            return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
          }
          if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
            return NextResponse.json({ error: "Coupon is not active yet" }, { status: 400 });
          }
          if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
            return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
          }
          if (
            coupon.max_uses != null &&
            Number(coupon.used_count) >= Number(coupon.max_uses)
          ) {
            return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
          }
          if (Number(coupon.min_order_amount) > 0 && subtotal < Number(coupon.min_order_amount)) {
            return NextResponse.json(
              { error: `Minimum order ₹${coupon.min_order_amount} required` },
              { status: 400 }
            );
          }
          if (coupon.service && service && coupon.service !== service) {
            return NextResponse.json(
              { error: `Coupon only valid for ${coupon.service}` },
              { status: 400 }
            );
          }

          const discount = calcDiscount(
            coupon.discount_type as "percent" | "fixed",
            Number(coupon.discount_value),
            subtotal,
            coupon.max_discount != null ? Number(coupon.max_discount) : null
          );

          return NextResponse.json({
            valid: true,
            code: coupon.code,
            discount,
            discount_type: coupon.discount_type,
            discount_value: Number(coupon.discount_value),
            description: coupon.description,
          });
        }
      } catch (e) {
        console.error("coupon validate:", e);
      }
    }

    // Fallback static codes when table missing / DB unavailable
    const rate = FALLBACK_CODES[code];
    if (rate != null) {
      const discount = Math.round(subtotal * rate);
      return NextResponse.json({
        valid: true,
        code,
        discount,
        discount_type: "percent",
        discount_value: rate * 100,
        description: "Fallback promo",
      });
    }

    return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
