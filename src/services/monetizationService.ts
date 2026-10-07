import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  SubscriptionDoc,
  SubscriptionWithId,
  MembershipDoc,
  MembershipWithId,
  ContactUnlockDoc,
  ContactUnlockWithId,
  AdvertiserDoc,
  AdvertiserWithId,
  TransactionDoc,
  TransactionWithId,
  SubscriptionPlanId,
  MembershipPlanId,
  SubscriptionStatus,
  MembershipStatus,
  AdvertiserStatus,
  RevenueStats,
  MonthlyRevenue,
  ContactUnlockStatus,
  ContactUnlockType,
  SupportRequestDoc,
  SupportRequestWithId,
  SupportRequestStatus,
} from "@/types/monetization";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";
import {
  WORKER_SUBSCRIPTION_PLANS,
  CUSTOMER_MEMBERSHIP_PLANS,
  ADVERTISING_PLANS,
  CONTACT_UNLOCK_PRICE,
  CONTACT_UNLOCK_CURRENCY,
  CUSTOMER_FREE_CONTACT_UNLOCKS,
  PLAN_DURATIONS,
  DEFAULT_WORKER_PLAN,
  DEFAULT_CUSTOMER_PLAN,
  DEFAULT_ADVERTISER_PLAN,
  WORKER_TRIAL_DAYS,
} from "@/lib/launchConfig";

const now = () => new Date();

export { WORKER_SUBSCRIPTION_PLANS, CUSTOMER_MEMBERSHIP_PLANS, ADVERTISING_PLANS, CONTACT_UNLOCK_PRICE, CONTACT_UNLOCK_CURRENCY, PLAN_DURATIONS, DEFAULT_WORKER_PLAN, DEFAULT_CUSTOMER_PLAN, DEFAULT_ADVERTISER_PLAN };

export function getDefaultSubscription(userId: string): SubscriptionDoc {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + WORKER_TRIAL_DAYS);
  return {
    userId,
    planId: "free",
    status: "trial",
    price: 0,
    currency: "INR",
    freeTrialStartDate: now(),
    freeTrialEndDate: trialEnd,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function getDefaultMembership(userId: string): MembershipDoc {
  return {
    userId,
    planId: "free",
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
}

export async function getSubscriptionByUserId(
  userId: string
): Promise<{ subscription: SubscriptionWithId | null; error: string | null }> {
  if (!db) {
    return { subscription: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "subscriptions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { subscription: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<SubscriptionDoc, "id">;
    return { subscription: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { subscription: null, error: err.message || "Failed to fetch subscription." };
  }
}

export async function createOrUpdateSubscription(
  userId: string,
  planId: SubscriptionPlanId,
  status: SubscriptionStatus = "pending",
  startDate?: Date,
  endDate?: Date,
  options?: { price?: number; currency?: string; paymentId?: string; orderId?: string; freeTrialStartDate?: Date; freeTrialEndDate?: Date }
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const { subscription } = await getSubscriptionByUserId(userId);
    const existingId = subscription?.id;
    const docRef = existingId ? doc(db, "subscriptions", existingId) : doc(collection(db, "subscriptions"));

    const plan = WORKER_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    const payload: SubscriptionDoc = {
      userId,
      planId,
      status,
      price: options?.price ?? plan?.price ?? 0,
      currency: options?.currency ?? "INR",
      startDate: startDate || (status === "active" ? now() : subscription?.startDate),
      endDate: endDate || (status === "active" ? getEndDate(planId) : subscription?.endDate),
      freeTrialStartDate: options?.freeTrialStartDate || subscription?.freeTrialStartDate,
      freeTrialEndDate: options?.freeTrialEndDate || subscription?.freeTrialEndDate,
      paymentId: options?.paymentId || subscription?.paymentId,
      orderId: options?.orderId || subscription?.orderId,
      createdAt: subscription?.createdAt || now(),
      updatedAt: now(),
    };

    await setDoc(docRef, sanitizeForFirestore(payload));

    void createNotification(userId, "subscription_updated", "Subscription updated", `Your subscription is now ${planId} (${status}).`, docRef.id);

    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to save subscription." };
  }
}

export async function createWorkerTrialSubscription(userId: string): Promise<{ id: string; error: string | null }> {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + WORKER_TRIAL_DAYS);
  return createOrUpdateSubscription(userId, "free", "trial", undefined, trialEnd, {
    freeTrialStartDate: now(),
    freeTrialEndDate: trialEnd,
    price: 0,
  });
}

export function hasActiveWorkerSubscription(subscription: SubscriptionWithId | null | undefined): boolean {
  if (!subscription) return false;
  const nowDate = new Date();

  if (subscription.status === "trial") {
    if (subscription.freeTrialEndDate && nowDate <= new Date(subscription.freeTrialEndDate)) {
      return true;
    }
    return false;
  }

  if (subscription.status === "active") {
    if (subscription.endDate && nowDate <= new Date(subscription.endDate)) {
      return true;
    }
    return false;
  }

  return false;
}

export async function getMembershipByUserId(
  userId: string
): Promise<{ membership: MembershipWithId | null; error: string | null }> {
  if (!db) {
    return { membership: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "memberships"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { membership: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<MembershipDoc, "id">;
    return { membership: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { membership: null, error: err.message || "Failed to fetch membership." };
  }
}

export async function createOrUpdateMembership(
  userId: string,
  planId: MembershipPlanId,
  status: MembershipStatus = "pending",
  startDate?: Date,
  endDate?: Date
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const { membership } = await getMembershipByUserId(userId);
    const existingId = membership?.id;
    const docRef = existingId ? doc(db, "memberships", existingId) : doc(collection(db, "memberships"));

    const payload: MembershipDoc = {
      userId,
      planId,
      status,
      startDate: startDate || (status === "active" ? now() : undefined),
      endDate: endDate || (status === "active" ? getEndDate(planId) : undefined),
      createdAt: membership?.createdAt || now(),
      updatedAt: now(),
    };

    await setDoc(docRef, sanitizeForFirestore(payload));

    void createNotification(userId, "membership_updated", "Membership updated", `Your membership is now ${planId} (${status}).`, docRef.id);

    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to save membership." };
  }
}

export async function getContactUnlock(
  customerId: string,
  workerId: string
): Promise<{ unlock: ContactUnlockWithId | null; error: string | null }> {
  if (!db) {
    return { unlock: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "contactUnlocks"),
      where("customerId", "==", customerId),
      where("workerId", "==", workerId),
      where("status", "==", "success"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { unlock: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<ContactUnlockDoc, "id">;
    return { unlock: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { unlock: null, error: err.message || "Failed to fetch contact unlock." };
  }
}

export async function getCustomerFreeContactCount(customerId: string): Promise<{ count: number; error: string | null }> {
  if (!db) {
    return { count: 0, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "contactUnlocks"),
      where("customerId", "==", customerId),
      where("unlockType", "==", "free"),
      where("status", "==", "success")
    );
    const snapshot = await getDocs(q);
    const count = Math.min(snapshot.size, CUSTOMER_FREE_CONTACT_UNLOCKS);
    return { count, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { count: 0, error: err.message || "Failed to fetch free contact count." };
  }
}

export async function getPendingContactUnlock(
  customerId: string,
  workerId: string
): Promise<{ unlock: ContactUnlockWithId | null; error: string | null }> {
  if (!db) {
    return { unlock: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "contactUnlocks"),
      where("customerId", "==", customerId),
      where("workerId", "==", workerId),
      where("status", "in", ["pending", "failed"]),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { unlock: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<ContactUnlockDoc, "id">;
    return { unlock: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { unlock: null, error: err.message || "Failed to fetch existing unlock." };
  }
}

export async function createContactUnlockOrder(
  customerId: string,
  workerId: string,
  amount = CONTACT_UNLOCK_PRICE
): Promise<{ orderId: string; unlockId: string; unlockType: ContactUnlockType; error: string | null }> {
  if (!db) {
    return { orderId: "", unlockId: "", unlockType: "paid", error: "Firestore is not available." };
  }

  try {
    const [unlockResult, countResult, pendingResult] = await Promise.all([
      getContactUnlock(customerId, workerId),
      getCustomerFreeContactCount(customerId),
      getPendingContactUnlock(customerId, workerId),
    ]);

    if (countResult.error) {
      return { orderId: "", unlockId: "", unlockType: "paid", error: countResult.error };
    }
    if (unlockResult.error) {
      return { orderId: "", unlockId: "", unlockType: "paid", error: unlockResult.error };
    }
    if (pendingResult.error) {
      return { orderId: "", unlockId: "", unlockType: "paid", error: pendingResult.error };
    }

    // If already unlocked, return the existing active unlock record without consuming credits
    if (unlockResult.unlock) {
      return { orderId: unlockResult.unlock.id, unlockId: unlockResult.unlock.id, unlockType: unlockResult.unlock.unlockType, error: null };
    }

    if (pendingResult.unlock) {
      return { orderId: pendingResult.unlock.id, unlockId: pendingResult.unlock.id, unlockType: "paid", error: null };
    }

    const remaining = Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - countResult.count);
    const unlockType: ContactUnlockType = remaining > 0 ? "free" : "paid";

    const orderId = `unlock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const docRef = doc(collection(db, "contactUnlocks"));

    // Zero-leakage privacy: worker phone numbers are never handled or stored in client payloads.
    // They are securely retrieved only via the authenticated API route after entitlement verification.
    const payload: ContactUnlockDoc = {
      customerId,
      workerId,
      amount: unlockType === "free" ? 0 : (amount || CONTACT_UNLOCK_PRICE),
      currency: CONTACT_UNLOCK_CURRENCY,
      unlockType,
      status: unlockType === "free" ? "success" : "pending",
      createdAt: now(),
      updatedAt: now(),
      ...(unlockType === "free" ? { unlockedAt: now() } : {}),
    };

    await setDoc(docRef, { ...sanitizeForFirestore(payload), orderId });

    if (unlockType === "free") {
      const txResult = await createTransaction({
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        userId: customerId,
        type: "customer_contact_unlock",
        amount: 0,
        currency: CONTACT_UNLOCK_CURRENCY,
        status: "success",
        referenceId: docRef.id,
        orderId,
      });
      if (txResult.error) {
        console.error("[monetization] Free-unlock bookkeeping failed:", txResult.error);
      }
    }

    return { orderId: docRef.id, unlockId: docRef.id, unlockType, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { orderId: "", unlockId: "", unlockType: "paid", error: err.message || "Failed to create unlock order." };
  }
}

export interface ContactUnlockApiResponse {
  success: boolean;
  phoneNumber?: string;
  whatsappUrl?: string;
  phone?: string;
  callUrl?: string;
  requiresPayment?: boolean;
  amount?: number;
  freeRemaining?: number;
  error?: string;
}

export async function requestContactUnlockApi(workerId: string): Promise<ContactUnlockApiResponse> {
  const { auth } = await import("@/lib/firebase");
  if (!auth?.currentUser) {
    return { success: false, error: "Please sign in to view contact details." };
  }

  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch("/api/contact-unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ workerId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${res.status}`,
        requiresPayment: res.status === 402 || !!data.requiresPayment,
        amount: data.amount,
        freeRemaining: data.freeRemaining,
      };
    }

    return {
      success: true,
      phoneNumber: data.phoneNumber,
      whatsappUrl: data.whatsappUrl,
      phone: data.phoneNumber,
      callUrl: data.phoneNumber ? `tel:${data.phoneNumber}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to contact unlock service.",
    };
  }
}

export async function verifyContactUnlockPayment(
  unlockId: string,
  paymentReference: string
): Promise<{ success: boolean; error: string | null }> {
  if (!db) {
    return { success: false, error: "Firestore is not available." };
  }

  try {
    const unlockRef = doc(db, "contactUnlocks", unlockId);
    const docSnap = await getDoc(unlockRef);
    if (!docSnap.exists()) {
      return { success: false, error: "Unlock record not found." };
    }

    await updateDoc(unlockRef, {
      status: "success",
      unlockedAt: now(),
      updatedAt: now(),
      paymentReference,
    });

    const unlockData = docSnap.data() as Omit<ContactUnlockDoc, "id">;
    void createNotification(
      unlockData.customerId,
      "contact_unlocked",
      "Contact unlocked",
      `You have unlocked a worker's contact.`,
      unlockId
    );

    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to verify payment." };
  }
}

export async function grantContactAccess(
  customerId: string,
  workerId: string
): Promise<{ unlocked: boolean; error: string | null }> {
  const { unlock } = await getContactUnlock(customerId, workerId);
  if (!unlock) {
    return { unlocked: false, error: "No valid unlock found." };
  }
  return { unlocked: true, error: null };
}

export async function createTransaction(
  payload: Omit<TransactionDoc, "createdAt" | "updatedAt">
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "transactions"));
    const tx: TransactionDoc = {
      ...payload,
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(docRef, sanitizeForFirestore(tx));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to create transaction." };
  }
}

export async function getTransactionsByUserId(
  userId: string,
  limitCount = 50
): Promise<{ transactions: TransactionWithId[]; error: string | null }> {
  if (!db) {
    return { transactions: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<TransactionDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { transactions, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { transactions: [], error: err.message || "Failed to fetch transactions." };
  }
}

export async function getRevenueStats(): Promise<{ stats: RevenueStats | null; error: string | null }> {
  if (!db) {
    return { stats: null, error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(collection(db, "transactions"));
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<TransactionDoc, "id">;
      return { id: doc.id, ...data };
    });

    const successful = transactions.filter((t) => t.status === "success");

    const totalRevenue = successful.reduce((sum, t) => sum + t.amount, 0);
    const subscriptionRevenue = successful
      .filter((t) => t.type === "worker_subscription")
      .reduce((sum, t) => sum + t.amount, 0);
    const membershipRevenue = successful
      .filter((t) => t.type === "customer_membership")
      .reduce((sum, t) => sum + t.amount, 0);
    const contactUnlockRevenue = successful
      .filter((t) => t.type === "customer_contact_unlock")
      .reduce((sum, t) => sum + t.amount, 0);
    const advertisingRevenue = successful
      .filter((t) => t.type === "advertising")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyMap = new Map<string, { revenue: number; count: number }>();
    successful.forEach((t) => {
      const date = new Date(t.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyMap.get(key) || { revenue: 0, count: 0 };
      monthlyMap.set(key, {
        revenue: current.revenue + t.amount,
        count: current.count + 1,
      });
    });

    const monthlyData: MonthlyRevenue[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const stats: RevenueStats = {
      totalRevenue,
      subscriptionRevenue,
      membershipRevenue,
      contactUnlockRevenue,
      advertisingRevenue,
      totalTransactions: successful.length,
      monthlyData,
    };

    return { stats, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { stats: null, error: err.message || "Failed to fetch revenue stats." };
  }
}

export async function getAllTransactions(
  limitCount = 100
): Promise<{ transactions: TransactionWithId[]; error: string | null }> {
  if (!db) {
    return { transactions: [], error: "Firestore is not available." };
  }

  try {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<TransactionDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { transactions, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { transactions: [], error: err.message || "Failed to fetch transactions." };
  }
}

export async function getAllSubscriptions(): Promise<{ subscriptions: SubscriptionWithId[]; error: string | null }> {
  if (!db) {
    return { subscriptions: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(collection(db, "subscriptions"));
    const subscriptions = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<SubscriptionDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { subscriptions, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { subscriptions: [], error: err.message || "Failed to fetch subscriptions." };
  }
}

export async function getAllMemberships(): Promise<{ memberships: MembershipWithId[]; error: string | null }> {
  if (!db) {
    return { memberships: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(collection(db, "memberships"));
    const memberships = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<MembershipDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { memberships, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { memberships: [], error: err.message || "Failed to fetch memberships." };
  }
}

export async function getContactUnlocksByCustomerId(
  customerId: string
): Promise<{ unlocks: ContactUnlockWithId[]; error: string | null }> {
  if (!db) {
    return { unlocks: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "contactUnlocks"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const unlocks = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<ContactUnlockDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { unlocks, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { unlocks: [], error: err.message || "Failed to fetch contact unlocks." };
  }
}

export async function getAllContactUnlocks(): Promise<{ unlocks: ContactUnlockWithId[]; error: string | null }> {
  if (!db) {
    return { unlocks: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(collection(db, "contactUnlocks"));
    const unlocks = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<ContactUnlockDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { unlocks, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { unlocks: [], error: err.message || "Failed to fetch contact unlocks." };
  }
}

export async function getSupportRequest(
  requestId: string
): Promise<{ request: SupportRequestWithId | null; error: string | null }> {
  if (!db) {
    return { request: null, error: "Firestore is not available." };
  }

  try {
    const docSnap = await getDoc(doc(db, "supportRequests", requestId));
    if (!docSnap.exists()) {
      return { request: null, error: null };
    }
    const data = docSnap.data() as Omit<SupportRequestDoc, "id">;
    return { request: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { request: null, error: err.message || "Failed to fetch support request." };
  }
}

export async function createSupportRequest(
  payload: Omit<SupportRequestDoc, "createdAt" | "updatedAt">
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "supportRequests"));
    const request: SupportRequestDoc = {
      ...payload,
      status: "open",
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(docRef, sanitizeForFirestore(request));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to create support request." };
  }
}

export async function updateSupportRequestStatus(
  requestId: string,
  status: SupportRequestStatus
): Promise<{ success: boolean; error: string | null }> {
  if (!db) {
    return { success: false, error: "Firestore is not available." };
  }

  try {
    await updateDoc(doc(db, "supportRequests", requestId), {
      status,
      updatedAt: now(),
    });
    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to update support request." };
  }
}

export async function getSupportRequestsByUserId(
  userId: string
): Promise<{ requests: SupportRequestWithId[]; error: string | null }> {
  if (!db) {
    return { requests: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "supportRequests"),
      where("customerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<SupportRequestDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { requests, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { requests: [], error: err.message || "Failed to fetch support requests." };
  }
}

export async function getAllSupportRequests(): Promise<{ requests: SupportRequestWithId[]; error: string | null }> {
  if (!db) {
    return { requests: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(query(collection(db, "supportRequests"), orderBy("createdAt", "desc")));
    const requests = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<SupportRequestDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { requests, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { requests: [], error: err.message || "Failed to fetch support requests." };
  }
}

export async function getAdvertiserByUserId(
  userId: string
): Promise<{ advertiser: AdvertiserWithId | null; error: string | null }> {
  if (!db) {
    return { advertiser: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "advertisers"),
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { advertiser: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<AdvertiserDoc, "id">;
    return { advertiser: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { advertiser: null, error: err.message || "Failed to fetch advertiser." };
  }
}

export async function createAdvertiser(
  data: Omit<AdvertiserDoc, "createdAt" | "updatedAt" | "status">
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "advertisers"));
    const payload: AdvertiserDoc = {
      ...data,
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(docRef, sanitizeForFirestore(payload));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to create advertiser." };
  }
}

export async function updateAdvertiserStatus(
  advertiserId: string,
  status: AdvertiserStatus
): Promise<{ success: boolean; error: string | null }> {
  if (!db) {
    return { success: false, error: "Firestore is not available." };
  }

  try {
    const advertiserRef = doc(db, "advertisers", advertiserId);
    const advertiserSnap = await getDoc(advertiserRef);
    const advertiserData = advertiserSnap.exists()
      ? (advertiserSnap.data() as Omit<AdvertiserDoc, "id">)
      : null;

    await updateDoc(advertiserRef, {
      status,
      updatedAt: now(),
    });

    if (advertiserData?.createdBy) {
      void createNotification(
        advertiserData.createdBy,
        "advertisement_updated",
        "Advertisement status updated",
        `Your advertisement for ${advertiserData?.businessName || "your business"} is now ${status}.`,
        advertiserId
      );
    }

    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to update advertiser." };
  }
}

export async function listAdvertisers(
  status?: AdvertiserStatus
): Promise<{ advertisers: AdvertiserWithId[]; error: string | null }> {
  if (!db) {
    return { advertisers: [], error: "Firestore is not available." };
  }

  try {
    let q = query(collection(db, "advertisers"), orderBy("createdAt", "desc"));
    if (status) {
      q = query(q, where("status", "==", status));
    }
    const snapshot = await getDocs(q);
    const advertisers = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<AdvertiserDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { advertisers, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { advertisers: [], error: err.message || "Failed to fetch advertisers." };
  }
}

function getEndDate(planId: string): Date {
  const days = PLAN_DURATIONS[planId] || 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function getTrialDaysRemaining(subscription: SubscriptionWithId | null | undefined): number {
  if (!subscription || subscription.status !== "trial" || !subscription.freeTrialEndDate) {
    return 0;
  }
  const nowDate = new Date();
  const endDate = new Date(subscription.freeTrialEndDate);
  const diff = endDate.getTime() - nowDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus,
  adminNotes?: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const docRef = doc(db, "subscriptions", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { error: "Subscription not found." };
    }
    const data = snap.data() as SubscriptionDoc;

    const updateData: Partial<SubscriptionDoc> & { adminNotes?: string } = {
      status,
      updatedAt: now(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (status === "active" && (!data.startDate || data.status !== "active")) {
      updateData.startDate = now();
      updateData.endDate = getEndDate(data.planId);
    }

    await updateDoc(docRef, sanitizeForFirestore(updateData));

    void createNotification(
      data.userId,
      "subscription_updated",
      "Subscription Status Updated",
      `Your subscription is now ${status}.`,
      id
    );

    return { error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || "Failed to update subscription status." };
  }
}

export async function updateMembershipStatus(
  id: string,
  status: MembershipStatus,
  adminNotes?: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const docRef = doc(db, "memberships", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { error: "Membership not found." };
    }
    const data = snap.data() as MembershipDoc;

    const updateData: Partial<MembershipDoc> & { adminNotes?: string } = {
      status,
      updatedAt: now(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (status === "active" && (!data.startDate || data.status !== "active")) {
      updateData.startDate = now();
      updateData.endDate = getEndDate(data.planId);
    }

    await updateDoc(docRef, sanitizeForFirestore(updateData));

    void createNotification(
      data.userId,
      "membership_updated",
      "Membership Status Updated",
      `Your membership is now ${status}.`,
      id
    );

    return { error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || "Failed to update membership status." };
  }
}

export async function updateContactUnlockStatus(
  id: string,
  status: ContactUnlockStatus
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const docRef = doc(db, "contactUnlocks", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { error: "Contact unlock not found." };
    }
    const data = snap.data() as ContactUnlockDoc;

    const updateData: Partial<ContactUnlockDoc> = {
      status,
      updatedAt: now(),
    };

    if (status === "success") {
      updateData.unlockedAt = now();
      if (!data.workerPhone && data.workerId) {
        const workerSnap = await getDoc(doc(db, "workers", data.workerId));
        if (workerSnap.exists()) {
          const wData = workerSnap.data();
          const phone = wData?.personalInfo?.phone || wData?.phone || null;
          if (phone) updateData.workerPhone = phone;
        }
      }
    }

    await updateDoc(docRef, sanitizeForFirestore(updateData));

    if (status === "success") {
      void createNotification(
        data.customerId,
        "contact_unlocked",
        "Contact Unlocked",
        "Your contact unlock request has been approved.",
        id
      );
    }

    return { error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { error: err.message || "Failed to update contact unlock status." };
  }
}

