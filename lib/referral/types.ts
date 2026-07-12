export type ReferralStatus =
  | "signed_up"
  | "ordered"
  | "completed"
  | "rejected"
  | "ineligible";

export type ReferralRewardStatus = "pending" | "completed" | "rejected";

export interface ReferralSettings {
  isEnabled: boolean;
  minOrderAmount: number;
  commissionPercent: number;
  updatedAt?: string;
}

export interface ReferralCodeInfo {
  code: string;
  link: string;
}

export interface ReferralHistoryItem {
  id: string;
  friendName: string;
  referralDate: string;
  firstOrderAmount: number | null;
  commissionEarned: number | null;
  status: ReferralStatus | ReferralRewardStatus;
  rewardCreditedDate: string | null;
}

export interface ReferralDashboard {
  programEnabled: boolean;
  code: string;
  link: string;
  stats: {
    totalReferrals: number;
    friendsSignedUp: number;
    friendsFirstOrder: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    availableBalance: number;
  };
  rules: {
    minOrderAmount: number;
    commissionPercent: number;
    description: string;
    example: string;
  };
  history: ReferralHistoryItem[];
  walletTransactions: Array<{
    id: string;
    title: string;
    amount: number;
    type: "credit" | "debit";
    date: string;
    status: string;
  }>;
}

export interface AdminReferralTransaction {
  id: string;
  referralId: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  orderId: string;
  orderAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: ReferralRewardStatus;
  creditedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminReferralAnalytics {
  totalReferrals: number;
  successfulReferrals: number;
  pendingRewards: number;
  rejectedRewards: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  programEnabled: boolean;
  minOrderAmount: number;
  commissionPercent: number;
}
