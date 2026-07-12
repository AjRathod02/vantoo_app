import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export interface SavedPaymentMethod {
  id: string;
  type: "upi" | "card";
  label: string;
  upiId?: string;
  cardLast4?: string;
  cardNetwork?: string;
  cardExpiry?: string;
  /** Token reference only — never raw PAN/CVV */
  razorpayTokenId?: string;
  isDefault: boolean;
  createdAt: string;
}

const memory = new Map<string, SavedPaymentMethod[]>();

function mapRow(row: Record<string, unknown>): SavedPaymentMethod {
  return {
    id: String(row.id),
    type: row.type as "upi" | "card",
    label: String(row.label ?? ""),
    upiId: row.upi_id ? String(row.upi_id) : undefined,
    cardLast4: row.card_last4 ? String(row.card_last4) : undefined,
    cardNetwork: row.card_network ? String(row.card_network) : undefined,
    cardExpiry: row.card_expiry ? String(row.card_expiry) : undefined,
    razorpayTokenId: row.razorpay_token_id
      ? String(row.razorpay_token_id)
      : undefined,
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
  };
}

export async function listSavedPaymentMethods(
  userId: string
): Promise<SavedPaymentMethod[]> {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("saved_payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (data) return data.map(mapRow);
    } catch (e) {
      console.error("listSavedPaymentMethods:", e);
    }
  }
  return memory.get(userId) ?? [];
}

export async function savePaymentMethod(
  userId: string,
  input: {
    type: "upi" | "card";
    label: string;
    upiId?: string;
    cardLast4?: string;
    cardNetwork?: string;
    cardExpiry?: string;
    razorpayTokenId?: string;
    isDefault?: boolean;
  }
): Promise<SavedPaymentMethod> {
  if (input.type === "card" && !input.razorpayTokenId && !input.cardLast4) {
    throw new Error("Card methods require a tokenized reference");
  }

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      if (input.isDefault) {
        await supabase
          .from("saved_payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId);
      }
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .insert({
          user_id: userId,
          type: input.type,
          label: input.label,
          upi_id: input.upiId ?? null,
          card_last4: input.cardLast4 ?? null,
          card_network: input.cardNetwork ?? null,
          card_expiry: input.cardExpiry ?? null,
          razorpay_token_id: input.razorpayTokenId ?? null,
          is_default: Boolean(input.isDefault),
        })
        .select()
        .single();
      if (!error && data) return mapRow(data);
      if (error) throw error;
    } catch (e) {
      console.error("savePaymentMethod:", e);
    }
  }

  const list = memory.get(userId) ?? [];
  if (input.isDefault) list.forEach((m) => (m.isDefault = false));
  const method: SavedPaymentMethod = {
    id: `pm_${Date.now()}`,
    type: input.type,
    label: input.label,
    upiId: input.upiId,
    cardLast4: input.cardLast4,
    cardNetwork: input.cardNetwork,
    cardExpiry: input.cardExpiry,
    razorpayTokenId: input.razorpayTokenId,
    isDefault: Boolean(input.isDefault) || list.length === 0,
    createdAt: new Date().toISOString(),
  };
  memory.set(userId, [method, ...list]);
  return method;
}

export async function updateSavedPaymentMethod(
  userId: string,
  id: string,
  patch: { label?: string; isDefault?: boolean }
) {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      if (patch.isDefault) {
        await supabase
          .from("saved_payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId);
      }
      const { data, error } = await supabase
        .from("saved_payment_methods")
        .update({
          ...(patch.label != null ? { label: patch.label } : {}),
          ...(patch.isDefault != null ? { is_default: patch.isDefault } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (!error && data) return mapRow(data);
    } catch (e) {
      console.error("updateSavedPaymentMethod:", e);
    }
  }

  const list = memory.get(userId) ?? [];
  const method = list.find((m) => m.id === id);
  if (!method) throw new Error("Not found");
  if (patch.isDefault) list.forEach((m) => (m.isDefault = false));
  if (patch.label != null) method.label = patch.label;
  if (patch.isDefault != null) method.isDefault = patch.isDefault;
  return method;
}

export async function removeSavedPaymentMethod(userId: string, id: string) {
  if (hasAdminClient()) {
    try {
      await createAdminClient()
        .from("saved_payment_methods")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      return { ok: true };
    } catch (e) {
      console.error("removeSavedPaymentMethod:", e);
    }
  }
  memory.set(
    userId,
    (memory.get(userId) ?? []).filter((m) => m.id !== id)
  );
  return { ok: true };
}
