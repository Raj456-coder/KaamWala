export type SubscriptionPlanId = "free" | "monthly" | "quarterly" | "half_yearly" | "yearly";
export type SubscriptionStatus = "trial" | "pending" | "active" | "expired" | "cancelled" | "failed";

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  badge?: string;
}

export interface SubscriptionPlan extends Plan {
  id: SubscriptionPlanId;
}

export interface SubscriptionDoc {
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  freeTrialStartDate?: Date;
  freeTrialEndDate?: Date;
  paymentId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithId extends SubscriptionDoc {
  id: string;
}

export type MembershipPlanId = "free" | "premium";
export type MembershipStatus = "active" | "expired" | "cancelled" | "pending";

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

export interface MembershipDoc {
  userId: string;
  planId: MembershipPlanId;
  status: MembershipStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipWithId extends MembershipDoc {
  id: string;
}

export type ContactUnlockStatus = "pending" | "success" | "failed" | "refunded";
export type ContactUnlockType = "free" | "paid";

export interface ContactUnlockDoc {
  customerId: string;
  workerId: string;
  amount: number;
  currency: string;
  unlockType: ContactUnlockType;
  status: ContactUnlockStatus;
  paymentId?: string;
  orderId?: string;
  workerPhone?: string;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactUnlockWithId extends ContactUnlockDoc {
  id: string;
}

export type AdvertiserStatus = "pending" | "active" | "paused" | "rejected";

export interface AdvertiserDoc {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  city: string;
  area: string;
  description: string;
  logo?: string;
  planId: string;
  status: AdvertiserStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdvertiserWithId extends AdvertiserDoc {
  id: string;
}

export type AdPlanId = "local" | "featured" | "premium";
export type TransactionType = "worker_subscription" | "customer_contact_unlock" | "customer_membership" | "advertising";
export type TransactionStatus = "pending" | "success" | "failed" | "refunded";

export interface TransactionDoc {
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  referenceId?: string;
  paymentId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithId extends TransactionDoc {
  id: string;
}

export interface RevenueStats {
  totalRevenue: number;
  subscriptionRevenue: number;
  membershipRevenue: number;
  contactUnlockRevenue: number;
  advertisingRevenue: number;
  totalTransactions: number;
  monthlyData: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export type SupportRequestStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportRequestDoc {
  customerId: string;
  workerId: string;
  relatedUnlockId?: string;
  reason: string;
  description: string;
  status: SupportRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportRequestWithId extends SupportRequestDoc {
  id: string;
}
