import type { Order } from "@/lib/types";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import type {
  AdminReferralAnalytics,
  AdminReferralTransaction,
  ReferralDashboard,
  ReferralHistoryItem,
  ReferralSettings,
  ReferralStatus,
} from "./types";

const DEFAULT_SETTINGS: ReferralSettings = {
  isEnabled: true,
  minOrderAmount: 350,
  commissionPercent: 5,
};

type MemoryReferral = {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  status: ReferralStatus;
  firstOrderId: string | null;
  firstOrderAmount: number | null;
  commissionAmount: number | null;
  rewardCreditedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  friendName: string;
};

type MemoryReward = {
  id: string;
  referralId: string;
  referrerId: string;
  referredId: string;
  orderId: string;
  orderAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: "pending" | "completed" | "rejected";
  creditedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  walletTransactionId: string | null;
};

type MemoryWalletTx = {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  title: string;
  referenceType: string;
  referenceId: string | null;
  status: string;
  createdAt: string;
};

type MemoryNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

const memory = {
  settings: { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() },
  codes: new Map<string, { userId: string; code: string }>(),
  codesByUser: new Map<string, string>(),
  referrals: new Map<string, MemoryReferral>(),
  referralsByReferred: new Map<string, string>(),
  rewards: new Map<string, MemoryReward>(),
  wallets: new Map<string, { balance: number; lifetimeEarned: number }>(),
  walletTx: [] as MemoryWalletTx[],
  notifications: [] as MemoryNotification[],
  profiles: new Map<string, { name: string }>(),
};

function uid(prefix = "rf") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function generateCode(name?: string): string {
  const base = (name ?? "VAN")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "VAN"}${suffix}`;
}

function orderValue(order: Pick<Order, "subtotal" | "discount">): number {
  return Math.max(0, Number(order.subtotal) - Number(order.discount ?? 0));
}

function maskName(name: string): string {
  const trimmed = name.trim() || "Friend";
  if (trimmed.length <= 2) return `${trimmed[0] ?? "F"}*`;
  return `${trimmed.slice(0, 2)}${"*".repeat(Math.min(trimmed.length - 2, 4))}`;
}

function shareLink(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/signup?ref=${encodeURIComponent(code)}`;
}

function rulesCopy(settings: ReferralSettings) {
  const exampleOrder = Math.max(settings.minOrderAmount, 500);
  const exampleEarn = Number(((exampleOrder * settings.commissionPercent) / 100).toFixed(2));
  return {
    minOrderAmount: settings.minOrderAmount,
    commissionPercent: settings.commissionPercent,
    description: `When a referred friend places their first successful order of ₹${settings.minOrderAmount} or more, you earn ${settings.commissionPercent}% of the final order value (after discounts). Rewards credit only after delivery.`,
    example: `Friend places a first order worth ₹${exampleOrder} and receives it → you earn ₹${exampleEarn} (${settings.commissionPercent}% of ₹${exampleOrder}).`,
  };
}

async function notify(
  userId: string,
  title: string,
  body: string,
  type = "referral"
) {
  if (hasAdminClient()) {
    try {
      await createAdminClient().from("user_notifications").insert({
        user_id: userId,
        title,
        body,
        type,
      });
      return;
    } catch (e) {
      console.error("notify failed:", e);
    }
  }
  memory.notifications.unshift({
    id: uid("n"),
    userId,
    title,
    body,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getReferralSettings(): Promise<ReferralSettings> {
  if (hasAdminClient()) {
    try {
      const { data, error } = await createAdminClient()
        .from("referral_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (!error && data) {
        return {
          isEnabled: Boolean(data.is_enabled),
          minOrderAmount: Number(data.min_order_amount),
          commissionPercent: Number(data.commission_percent),
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.error("getReferralSettings:", e);
    }
  }
  return { ...memory.settings };
}

export async function updateReferralSettings(
  patch: Partial<ReferralSettings>,
  updatedBy?: string
): Promise<ReferralSettings> {
  const current = await getReferralSettings();
  const next: ReferralSettings = {
    isEnabled: patch.isEnabled ?? current.isEnabled,
    minOrderAmount: patch.minOrderAmount ?? current.minOrderAmount,
    commissionPercent: patch.commissionPercent ?? current.commissionPercent,
    updatedAt: new Date().toISOString(),
  };

  if (hasAdminClient()) {
    try {
      const { data, error } = await createAdminClient()
        .from("referral_settings")
        .upsert({
          id: "default",
          is_enabled: next.isEnabled,
          min_order_amount: next.minOrderAmount,
          commission_percent: next.commissionPercent,
          updated_by: updatedBy ?? null,
          updated_at: next.updatedAt,
        })
        .select()
        .single();
      if (!error && data) {
        return {
          isEnabled: Boolean(data.is_enabled),
          minOrderAmount: Number(data.min_order_amount),
          commissionPercent: Number(data.commission_percent),
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.error("updateReferralSettings:", e);
    }
  }

  memory.settings = {
    isEnabled: next.isEnabled,
    minOrderAmount: next.minOrderAmount,
    commissionPercent: next.commissionPercent,
    updatedAt: next.updatedAt ?? new Date().toISOString(),
  };
  return next;
}

export async function ensureReferralCode(
  userId: string,
  userName?: string,
  origin = "https://vantoo.app"
): Promise<{ code: string; link: string }> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing?.code) {
        return { code: existing.code, link: shareLink(origin, existing.code) };
      }

      let code = generateCode(userName);
      for (let i = 0; i < 5; i++) {
        const { data, error } = await supabase
          .from("referral_codes")
          .insert({ user_id: userId, code })
          .select("code")
          .single();
        if (!error && data) {
          return { code: data.code, link: shareLink(origin, data.code) };
        }
        code = generateCode(userName);
      }
    } catch (e) {
      console.error("ensureReferralCode:", e);
    }
  }

  const existingCode = memory.codesByUser.get(userId);
  if (existingCode) {
    return { code: existingCode, link: shareLink(origin, existingCode) };
  }
  const code = generateCode(userName);
  memory.codes.set(code.toUpperCase(), { userId, code });
  memory.codesByUser.set(userId, code);
  if (userName) memory.profiles.set(userId, { name: userName });
  return { code, link: shareLink(origin, code) };
}

export async function applyReferralOnSignup(input: {
  referredUserId: string;
  referredName: string;
  referralCode?: string | null;
}): Promise<{ applied: boolean; reason?: string }> {
  const settings = await getReferralSettings();
  if (!settings.isEnabled) {
    return { applied: false, reason: "Referral program is disabled" };
  }

  const raw = input.referralCode?.trim();
  if (!raw) return { applied: false, reason: "No referral code" };

  const code = raw.toUpperCase();

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: codeRow } = await supabase
        .from("referral_codes")
        .select("id, user_id, code, is_active")
        .ilike("code", code)
        .maybeSingle();

      if (!codeRow || !codeRow.is_active) {
        return { applied: false, reason: "Invalid referral code" };
      }
      if (codeRow.user_id === input.referredUserId) {
        return { applied: false, reason: "Self-referral is not allowed" };
      }

      const { data: existing } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_id", input.referredUserId)
        .maybeSingle();
      if (existing) {
        return { applied: false, reason: "Already referred" };
      }

      const { error } = await supabase.from("referrals").insert({
        referrer_id: codeRow.user_id,
        referred_id: input.referredUserId,
        referral_code_id: codeRow.id,
        status: "signed_up",
      });
      if (error) {
        console.error("applyReferralOnSignup insert:", error.message);
        return { applied: false, reason: error.message };
      }

      const { data: codeFresh } = await supabase
        .from("referral_codes")
        .select("usage_count")
        .eq("id", codeRow.id)
        .single();
      await supabase
        .from("referral_codes")
        .update({ usage_count: Number(codeFresh?.usage_count ?? 0) + 1 })
        .eq("id", codeRow.id);

      await notify(
        codeRow.user_id,
        "New friend joined",
        `${maskName(input.referredName)} signed up using your referral code ${codeRow.code}.`
      );
      await notify(
        input.referredUserId,
        "Referral applied",
        `You signed up using referral code ${codeRow.code}. Place your first order of ₹${settings.minOrderAmount}+ to unlock rewards for your friend.`
      );

      return { applied: true };
    } catch (e) {
      console.error("applyReferralOnSignup:", e);
    }
  }

  const codeEntry = memory.codes.get(code);
  if (!codeEntry) return { applied: false, reason: "Invalid referral code" };
  if (codeEntry.userId === input.referredUserId) {
    return { applied: false, reason: "Self-referral is not allowed" };
  }
  if (memory.referralsByReferred.has(input.referredUserId)) {
    return { applied: false, reason: "Already referred" };
  }

  const id = uid("ref");
  const now = new Date().toISOString();
  memory.referrals.set(id, {
    id,
    referrerId: codeEntry.userId,
    referredId: input.referredUserId,
    code: codeEntry.code,
    status: "signed_up",
    firstOrderId: null,
    firstOrderAmount: null,
    commissionAmount: null,
    rewardCreditedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
    friendName: input.referredName,
  });
  memory.referralsByReferred.set(input.referredUserId, id);
  memory.profiles.set(input.referredUserId, { name: input.referredName });

  await notify(
    codeEntry.userId,
    "New friend joined",
    `${maskName(input.referredName)} signed up using your referral code ${codeEntry.code}.`
  );
  await notify(
    input.referredUserId,
    "Referral applied",
    `You signed up using referral code ${codeEntry.code}. Place your first order of ₹${settings.minOrderAmount}+ to unlock rewards for your friend.`
  );

  return { applied: true };
}

async function creditWallet(
  userId: string,
  amount: number,
  title: string,
  referenceId: string
): Promise<string> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      let { data: wallet } = await supabase
        .from("referral_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!wallet) {
        const inserted = await supabase
          .from("referral_wallets")
          .insert({ user_id: userId, balance: 0, lifetime_earned: 0 })
          .select()
          .single();
        wallet = inserted.data;
      }

      if (!wallet) throw new Error("Could not create wallet");

      const balanceAfter = Number(wallet.balance) + amount;
      const lifetime = Number(wallet.lifetime_earned) + amount;

      await supabase
        .from("referral_wallets")
        .update({
          balance: balanceAfter,
          lifetime_earned: lifetime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      const { data: tx } = await supabase
        .from("referral_wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          type: "credit",
          amount,
          balance_after: balanceAfter,
          title,
          reference_type: "referral_reward",
          reference_id: referenceId,
          status: "completed",
        })
        .select("id")
        .single();

      return tx?.id ?? uid("wtx");
    } catch (e) {
      console.error("creditWallet:", e);
    }
  }

  const wallet = memory.wallets.get(userId) ?? { balance: 0, lifetimeEarned: 0 };
  wallet.balance += amount;
  wallet.lifetimeEarned += amount;
  memory.wallets.set(userId, wallet);
  const txId = uid("wtx");
  memory.walletTx.unshift({
    id: txId,
    userId,
    type: "credit",
    amount,
    balanceAfter: wallet.balance,
    title,
    referenceType: "referral_reward",
    referenceId,
    status: "completed",
    createdAt: new Date().toISOString(),
  });
  return txId;
}

/** Called when a referred user places an order (first order tracking). */
export async function onReferredOrderPlaced(order: Order): Promise<void> {
  if (!order.userId) return;
  const settings = await getReferralSettings();
  if (!settings.isEnabled) return;

  const value = orderValue(order);

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: referral } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_id", order.userId)
        .maybeSingle();

      if (!referral || referral.status !== "signed_up") return;

      if (value < settings.minOrderAmount) {
        await supabase
          .from("referrals")
          .update({
            status: "ineligible",
            first_order_id: order.id,
            first_order_amount: value,
            updated_at: new Date().toISOString(),
            rejection_reason: `First order ₹${value} below minimum ₹${settings.minOrderAmount}`,
          })
          .eq("id", referral.id);
        return;
      }

      await supabase
        .from("referrals")
        .update({
          status: "ordered",
          first_order_id: order.id,
          first_order_amount: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral.id);

      const commission = Number(((value * settings.commissionPercent) / 100).toFixed(2));
      await supabase.from("referral_rewards").insert({
        referral_id: referral.id,
        referrer_id: referral.referrer_id,
        referred_id: referral.referred_id,
        order_id: order.id,
        order_amount: value,
        commission_percent: settings.commissionPercent,
        commission_amount: commission,
        status: "pending",
      });

      await notify(
        referral.referrer_id,
        "Friend placed first order",
        `Your referral placed an eligible first order of ₹${value}. Commission of ₹${commission} will credit after delivery.`
      );
      return;
    } catch (e) {
      console.error("onReferredOrderPlaced:", e);
    }
  }

  const refId = memory.referralsByReferred.get(order.userId);
  if (!refId) return;
  const referral = memory.referrals.get(refId);
  if (!referral || referral.status !== "signed_up") return;

  const now = new Date().toISOString();
  if (value < settings.minOrderAmount) {
    referral.status = "ineligible";
    referral.firstOrderId = order.id;
    referral.firstOrderAmount = value;
    referral.rejectionReason = `First order ₹${value} below minimum ₹${settings.minOrderAmount}`;
    referral.updatedAt = now;
    return;
  }

  referral.status = "ordered";
  referral.firstOrderId = order.id;
  referral.firstOrderAmount = value;
  referral.updatedAt = now;

  const commission = Number(((value * settings.commissionPercent) / 100).toFixed(2));
  const rewardId = uid("rr");
  memory.rewards.set(rewardId, {
    id: rewardId,
    referralId: referral.id,
    referrerId: referral.referrerId,
    referredId: referral.referredId,
    orderId: order.id,
    orderAmount: value,
    commissionPercent: settings.commissionPercent,
    commissionAmount: commission,
    status: "pending",
    creditedAt: null,
    rejectionReason: null,
    createdAt: now,
    walletTransactionId: null,
  });

  await notify(
    referral.referrerId,
    "Friend placed first order",
    `Your referral placed an eligible first order of ₹${value}. Commission of ₹${commission} will credit after delivery.`
  );
}

/** Credit commission when first eligible order is delivered. */
export async function onOrderDelivered(order: Order): Promise<void> {
  if (!order.userId) return;
  const settings = await getReferralSettings();
  if (!settings.isEnabled) return;

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: reward } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("order_id", order.id)
        .eq("status", "pending")
        .maybeSingle();

      if (!reward) {
        // Order may have been delivered without prior pending reward (e.g. admin status jump)
        const { data: referral } = await supabase
          .from("referrals")
          .select("*")
          .eq("referred_id", order.userId)
          .in("status", ["signed_up", "ordered"])
          .maybeSingle();

        if (referral && (!referral.first_order_id || referral.first_order_id === order.id)) {
          await onReferredOrderPlaced(order);
          const { data: created } = await supabase
            .from("referral_rewards")
            .select("*")
            .eq("order_id", order.id)
            .eq("status", "pending")
            .maybeSingle();
          if (!created) return;
          return onOrderDelivered(order);
        }
        return;
      }

      const value = Number(reward.order_amount);
      if (value < settings.minOrderAmount) {
        await supabase
          .from("referral_rewards")
          .update({
            status: "rejected",
            rejection_reason: "Order below minimum",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reward.id);
        await supabase
          .from("referrals")
          .update({ status: "ineligible", updated_at: new Date().toISOString() })
          .eq("id", reward.referral_id);
        return;
      }

      const txId = await creditWallet(
        reward.referrer_id,
        Number(reward.commission_amount),
        `Referral commission · Order ${order.id}`,
        reward.id
      );
      const now = new Date().toISOString();

      await supabase
        .from("referral_rewards")
        .update({
          status: "completed",
          credited_at: now,
          wallet_transaction_id: txId,
          updated_at: now,
        })
        .eq("id", reward.id);

      await supabase
        .from("referrals")
        .update({
          status: "completed",
          commission_amount: reward.commission_amount,
          reward_credited_at: now,
          updated_at: now,
        })
        .eq("id", reward.referral_id);

      await notify(
        reward.referrer_id,
        "Referral reward credited",
        `₹${Number(reward.commission_amount).toFixed(2)} was added to your referral wallet for order ${order.id}.`
      );
      return;
    } catch (e) {
      console.error("onOrderDelivered:", e);
    }
  }

  const reward = Array.from(memory.rewards.values()).find(
    (r) => r.orderId === order.id && r.status === "pending"
  );
  if (!reward) {
    const refId = memory.referralsByReferred.get(order.userId);
    const referral = refId ? memory.referrals.get(refId) : undefined;
    if (referral && (referral.status === "signed_up" || referral.status === "ordered")) {
      await onReferredOrderPlaced(order);
      return onOrderDelivered(order);
    }
    return;
  }

  const txId = await creditWallet(
    reward.referrerId,
    reward.commissionAmount,
    `Referral commission · Order ${order.id}`,
    reward.id
  );
  const now = new Date().toISOString();
  reward.status = "completed";
  reward.creditedAt = now;
  reward.walletTransactionId = txId;

  const referral = memory.referrals.get(reward.referralId);
  if (referral) {
    referral.status = "completed";
    referral.commissionAmount = reward.commissionAmount;
    referral.rewardCreditedAt = now;
    referral.updatedAt = now;
  }

  await notify(
    reward.referrerId,
    "Referral reward credited",
    `₹${reward.commissionAmount.toFixed(2)} was added to your referral wallet for order ${order.id}.`
  );
}

/** Reject pending/completed reward on cancel/refund/return of first order. */
export async function onOrderIneligible(
  order: Order,
  reason: string
): Promise<void> {
  if (!order.userId) return;

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: reward } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();

      if (!reward || reward.status === "rejected") return;

      if (reward.status === "completed" && reward.wallet_transaction_id) {
        // Reverse wallet credit
        const amount = Number(reward.commission_amount);
        const { data: wallet } = await supabase
          .from("referral_wallets")
          .select("*")
          .eq("user_id", reward.referrer_id)
          .maybeSingle();
        if (wallet && Number(wallet.balance) >= amount) {
          const balanceAfter = Number(wallet.balance) - amount;
          await supabase
            .from("referral_wallets")
            .update({
              balance: balanceAfter,
              lifetime_earned: Math.max(0, Number(wallet.lifetime_earned) - amount),
              updated_at: new Date().toISOString(),
            })
            .eq("id", wallet.id);
          await supabase.from("referral_wallet_transactions").insert({
            wallet_id: wallet.id,
            user_id: reward.referrer_id,
            type: "debit",
            amount,
            balance_after: balanceAfter,
            title: `Referral reversed · ${reason}`,
            reference_type: "referral_reversal",
            reference_id: reward.id,
            status: "completed",
          });
        }
      }

      await supabase
        .from("referral_rewards")
        .update({
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reward.id);

      await supabase
        .from("referrals")
        .update({
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reward.referral_id);
      return;
    } catch (e) {
      console.error("onOrderIneligible:", e);
    }
  }

  const reward = Array.from(memory.rewards.values()).find((r) => r.orderId === order.id);
  if (!reward || reward.status === "rejected") return;

  if (reward.status === "completed") {
    const wallet = memory.wallets.get(reward.referrerId);
    if (wallet && wallet.balance >= reward.commissionAmount) {
      wallet.balance -= reward.commissionAmount;
      wallet.lifetimeEarned = Math.max(0, wallet.lifetimeEarned - reward.commissionAmount);
      memory.walletTx.unshift({
        id: uid("wtx"),
        userId: reward.referrerId,
        type: "debit",
        amount: reward.commissionAmount,
        balanceAfter: wallet.balance,
        title: `Referral reversed · ${reason}`,
        referenceType: "referral_reversal",
        referenceId: reward.id,
        status: "completed",
        createdAt: new Date().toISOString(),
      });
    }
  }

  reward.status = "rejected";
  reward.rejectionReason = reason;
  const referral = memory.referrals.get(reward.referralId);
  if (referral) {
    referral.status = "rejected";
    referral.rejectionReason = reason;
    referral.updatedAt = new Date().toISOString();
  }
}

export async function getReferralDashboard(
  userId: string,
  userName?: string,
  origin = "https://vantoo.app"
): Promise<ReferralDashboard> {
  const settings = await getReferralSettings();
  const { code, link } = await ensureReferralCode(userId, userName, origin);

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      const referredIds = (referrals ?? []).map((r) => r.referred_id);
      const { data: profiles } =
        referredIds.length > 0
          ? await supabase.from("profiles").select("id, name").in("id", referredIds)
          : { data: [] as { id: string; name: string }[] };
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

      const { data: wallet } = await supabase
        .from("referral_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: txs } = await supabase
        .from("referral_wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      const rows = referrals ?? [];
      const history: ReferralHistoryItem[] = rows.map((r) => {
        const name = nameMap.get(r.referred_id) ?? "Friend";
        return {
          id: r.id,
          friendName: maskName(name),
          referralDate: r.created_at,
          firstOrderAmount: r.first_order_amount != null ? Number(r.first_order_amount) : null,
          commissionEarned: r.commission_amount != null ? Number(r.commission_amount) : null,
          status: r.status as ReferralStatus,
          rewardCreditedDate: r.reward_credited_at,
        };
      });

      const successful = rows.filter((r) => r.status === "completed").length;
      const pending = rows.filter((r) =>
        ["signed_up", "ordered"].includes(r.status)
      ).length;
      const firstOrder = rows.filter((r) =>
        ["ordered", "completed"].includes(r.status)
      ).length;

      return {
        programEnabled: settings.isEnabled,
        code,
        link,
        stats: {
          totalReferrals: rows.length,
          friendsSignedUp: rows.length,
          friendsFirstOrder: firstOrder,
          successfulReferrals: successful,
          pendingReferrals: pending,
          totalEarnings: Number(wallet?.lifetime_earned ?? 0),
          availableBalance: Number(wallet?.balance ?? 0),
        },
        rules: rulesCopy(settings),
        history,
        walletTransactions: (txs ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          amount: Number(t.amount),
          type: t.type as "credit" | "debit",
          date: t.created_at,
          status: t.status,
        })),
      };
    } catch (e) {
      console.error("getReferralDashboard:", e);
    }
  }

  const refs = Array.from(memory.referrals.values()).filter(
    (r) => r.referrerId === userId
  );
  const wallet = memory.wallets.get(userId) ?? { balance: 0, lifetimeEarned: 0 };
  const txs = memory.walletTx.filter((t) => t.userId === userId);

  return {
    programEnabled: settings.isEnabled,
    code,
    link,
    stats: {
      totalReferrals: refs.length,
      friendsSignedUp: refs.length,
      friendsFirstOrder: refs.filter((r) =>
        ["ordered", "completed"].includes(r.status)
      ).length,
      successfulReferrals: refs.filter((r) => r.status === "completed").length,
      pendingReferrals: refs.filter((r) =>
        ["signed_up", "ordered"].includes(r.status)
      ).length,
      totalEarnings: wallet.lifetimeEarned,
      availableBalance: wallet.balance,
    },
    rules: rulesCopy(settings),
    history: refs.map((r) => ({
      id: r.id,
      friendName: maskName(r.friendName),
      referralDate: r.createdAt,
      firstOrderAmount: r.firstOrderAmount,
      commissionEarned: r.commissionAmount,
      status: r.status,
      rewardCreditedDate: r.rewardCreditedAt,
    })),
    walletTransactions: txs.map((t) => ({
      id: t.id,
      title: t.title,
      amount: t.amount,
      type: t.type,
      date: t.createdAt,
      status: t.status,
    })),
  };
}

export async function getReferralWallet(userId: string) {
  const dash = await getReferralDashboard(userId);
  return {
    balance: dash.stats.availableBalance,
    lifetimeEarned: dash.stats.totalEarnings,
    transactions: dash.walletTransactions,
  };
}

export async function listUserNotifications(userId: string) {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("user_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: Boolean(n.read),
        createdAt: n.created_at,
      }));
    } catch (e) {
      console.error("listUserNotifications:", e);
    }
  }
  return memory.notifications
    .filter((n) => n.userId === userId)
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    }));
}

export async function adminListReferralTransactions(): Promise<AdminReferralTransaction[]> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("referral_rewards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const rows = data ?? [];
      const userIds = Array.from(
        new Set(rows.flatMap((r) => [r.referrer_id, r.referred_id]))
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

      return rows.map((r) => ({
        id: r.id,
        referralId: r.referral_id,
        referrerId: r.referrer_id,
        referrerName: nameMap.get(r.referrer_id) ?? "Unknown",
        referredId: r.referred_id,
        referredName: nameMap.get(r.referred_id) ?? "Unknown",
        orderId: r.order_id,
        orderAmount: Number(r.order_amount),
        commissionPercent: Number(r.commission_percent),
        commissionAmount: Number(r.commission_amount),
        status: r.status,
        creditedAt: r.credited_at,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
      }));
    } catch (e) {
      console.error("adminListReferralTransactions:", e);
    }
  }

  return Array.from(memory.rewards.values()).map((r) => {
    const referral = memory.referrals.get(r.referralId);
    return {
      id: r.id,
      referralId: r.referralId,
      referrerId: r.referrerId,
      referrerName: memory.profiles.get(r.referrerId)?.name ?? "Referrer",
      referredId: r.referredId,
      referredName: referral?.friendName ?? memory.profiles.get(r.referredId)?.name ?? "Friend",
      orderId: r.orderId,
      orderAmount: r.orderAmount,
      commissionPercent: r.commissionPercent,
      commissionAmount: r.commissionAmount,
      status: r.status,
      creditedAt: r.creditedAt,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
    };
  });
}

export async function adminGetReferralAnalytics(): Promise<AdminReferralAnalytics> {
  const settings = await getReferralSettings();
  const txs = await adminListReferralTransactions();

  let totalReferrals = 0;
  if (hasAdminClient()) {
    try {
      const { count } = await createAdminClient()
        .from("referrals")
        .select("*", { count: "exact", head: true });
      totalReferrals = count ?? 0;
    } catch {
      totalReferrals = memory.referrals.size;
    }
  } else {
    totalReferrals = memory.referrals.size;
  }

  return {
    totalReferrals,
    successfulReferrals: txs.filter((t) => t.status === "completed").length,
    pendingRewards: txs.filter((t) => t.status === "pending").length,
    rejectedRewards: txs.filter((t) => t.status === "rejected").length,
    totalCommissionPaid: txs
      .filter((t) => t.status === "completed")
      .reduce((s, t) => s + t.commissionAmount, 0),
    pendingCommission: txs
      .filter((t) => t.status === "pending")
      .reduce((s, t) => s + t.commissionAmount, 0),
    programEnabled: settings.isEnabled,
    minOrderAmount: settings.minOrderAmount,
    commissionPercent: settings.commissionPercent,
  };
}

export async function adminUpdateRewardStatus(
  rewardId: string,
  status: "completed" | "rejected",
  rejectionReason?: string
): Promise<{ ok: boolean; error?: string }> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: reward } = await supabase
        .from("referral_rewards")
        .select("*")
        .eq("id", rewardId)
        .maybeSingle();
      if (!reward) return { ok: false, error: "Reward not found" };

      if (status === "rejected") {
        if (reward.status === "completed") {
          await onOrderIneligible(
            {
              id: reward.order_id,
              userId: reward.referred_id,
              items: [],
              subtotal: Number(reward.order_amount),
              deliveryFee: 0,
              tax: 0,
              discount: 0,
              total: Number(reward.order_amount),
              status: "cancelled",
              paymentMethod: "cod",
              address: {
                id: "",
                label: "",
                line1: "",
                line2: "",
                city: "",
                pincode: "",
              },
              placedAt: reward.created_at,
              service: "grocery",
            },
            rejectionReason ?? "Rejected by admin"
          );
        } else {
          await supabase
            .from("referral_rewards")
            .update({
              status: "rejected",
              rejection_reason: rejectionReason ?? "Rejected by admin",
              updated_at: new Date().toISOString(),
            })
            .eq("id", rewardId);
          await supabase
            .from("referrals")
            .update({
              status: "rejected",
              rejection_reason: rejectionReason ?? "Rejected by admin",
              updated_at: new Date().toISOString(),
            })
            .eq("id", reward.referral_id);
        }
        return { ok: true };
      }

      if (reward.status === "pending") {
        await onOrderDelivered({
          id: reward.order_id,
          userId: reward.referred_id,
          items: [],
          subtotal: Number(reward.order_amount),
          deliveryFee: 0,
          tax: 0,
          discount: 0,
          total: Number(reward.order_amount),
          status: "delivered",
          paymentMethod: "cod",
          address: {
            id: "",
            label: "",
            line1: "",
            line2: "",
            city: "",
            pincode: "",
          },
          placedAt: reward.created_at,
          service: "grocery",
        });
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed" };
    }
  }

  const reward = memory.rewards.get(rewardId);
  if (!reward) return { ok: false, error: "Reward not found" };

  if (status === "rejected") {
    await onOrderIneligible(
      {
        id: reward.orderId,
        userId: reward.referredId,
        items: [],
        subtotal: reward.orderAmount,
        deliveryFee: 0,
        tax: 0,
        discount: 0,
        total: reward.orderAmount,
        status: "cancelled",
        paymentMethod: "cod",
        address: {
          id: "",
          label: "",
          line1: "",
          line2: "",
          city: "",
          pincode: "",
        },
        placedAt: reward.createdAt,
        service: "grocery",
      },
      rejectionReason ?? "Rejected by admin"
    );
    return { ok: true };
  }

  await onOrderDelivered({
    id: reward.orderId,
    userId: reward.referredId,
    items: [],
    subtotal: reward.orderAmount,
    deliveryFee: 0,
    tax: 0,
    discount: 0,
    total: reward.orderAmount,
    status: "delivered",
    paymentMethod: "cod",
    address: {
      id: "",
      label: "",
      line1: "",
      line2: "",
      city: "",
      pincode: "",
    },
    placedAt: reward.createdAt,
    service: "grocery",
  });
  return { ok: true };
}
