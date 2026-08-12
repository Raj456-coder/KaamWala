import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  SubscriptionDoc,
  SubscriptionWithId,
  SubscriptionPlanId,
  SubscriptionStatus,
  ContactUnlockDoc,
  ContactUnlockWithId,
  TransactionDoc,
  TransactionWithId,
  TransactionType,
  TransactionStatus,
  SupportRequestDoc,
  SupportRequestWithId,
  SupportRequestStatus,
  ContactUnlockType,
} from "@/types/monetization";
import { PaymentRecord } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";
import { createWorkerTrialSubscription, hasActiveWorkerSubscription, getCustomerFreeContactCount, getAllTransactions } from "./monetizationService";

const now = () => new Date();

export async function createPaymentOrder(
  userId: string,
  type: TransactionType,
  amount: number,
  currency = "INR",
  referenceId?: string
): Promise<{ orderId: string; error: string | null }> {
  if (!db) {
    return { orderId: "", error: "Firestore is not available." };
  }

  try {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const txRef = doc(collection(db, "transactions"));

    const payload: Omit<TransactionDoc, "createdAt" | "updatedAt"> = {
      transactionId: orderId,
      userId,
      type,
      amount,
      currency,
      status: "pending",
      referenceId,
      orderId,
    };

    await setDoc(txRef, sanitizeForFirestore(payload));
    return { orderId: txRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { orderId: "", error: err.message || "Failed to create payment order." };
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  success = true
): Promise<{ success: boolean; error: string | null }> {
  if (!db) {
    return { success: false, error: "Firestore is not available." };
  }

  try {
    const txRef = doc(db, "transactions", orderId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) {
      return { success: false, error: "Transaction not found." };
    }

    const txData = txSnap.data() as Omit<TransactionDoc, "id">;
    if (txData.status !== "pending") {
      return { success: false, error: "Transaction already processed." };
    }

    const status: TransactionStatus = success ? "success" : "failed";
    await updateDoc(txRef, {
      status,
      paymentId,
      updatedAt: now(),
    });

    if (success && txData.referenceId) {
      if (txData.type === "worker_subscription") {
        await activateSubscriptionFromPayment(txData.userId, txData.referenceId, txData.amount, paymentId, orderId);
      } else if (txData.type === "customer_contact_unlock") {
        await activateContactUnlockFromPayment(txData.referenceId, paymentId);
      }
    }

    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to verify payment." };
  }
}

async function activateSubscriptionFromPayment(
  userId: string,
  subscriptionId: string,
  amount: number,
  paymentId: string,
  orderId: string
): Promise<void> {
  if (!db) return;
  const subRef = doc(db, "subscriptions", subscriptionId);
  const subSnap = await getDoc(subRef);
  if (!subSnap.exists()) return;

  const subData = subSnap.data() as Omit<SubscriptionDoc, "id">;
  const startDate = now();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (subData.planId === "monthly" ? 30 : subData.planId === "quarterly" ? 90 : subData.planId === "half_yearly" ? 180 : 365));

  await updateDoc(subRef, {
    status: "active",
    startDate,
    endDate,
    paymentId,
    orderId,
    updatedAt: now(),
  });
}

async function activateContactUnlockFromPayment(
  unlockId: string,
  paymentId: string
): Promise<void> {
  if (!db) return;
  const unlockRef = doc(db, "contactUnlocks", unlockId);
  const unlockSnap = await getDoc(unlockRef);
  if (!unlockSnap.exists()) return;

  const unlockData = unlockSnap.data() as Omit<ContactUnlockDoc, "id">;
  await updateDoc(unlockRef, {
    status: "success",
    paymentId,
    unlockedAt: now(),
    updatedAt: now(),
  });

  void createNotification(
    unlockData.customerId,
    "contact_unlocked",
    "Contact unlocked",
    `You have unlocked a worker's contact.`,
    unlockId
  );
}

export async function handleRefund(
  transactionId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!db) {
    return { success: false, error: "Firestore is not available." };
  }

  try {
    const txRef = doc(db, "transactions", transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) {
      return { success: false, error: "Transaction not found." };
    }

    await updateDoc(txRef, {
      status: "refunded",
      updatedAt: now(),
    });

    return { success: true, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to process refund." };
  }
}

export async function getPaymentStatus(orderId: string): Promise<{ status: TransactionStatus | null; error: string | null }> {
  if (!db) {
    return { status: null, error: "Firestore is not available." };
  }

  try {
    const txSnap = await getDoc(doc(db, "transactions", orderId));
    if (!txSnap.exists()) {
      return { status: null, error: "Transaction not found." };
    }
    const data = txSnap.data() as Omit<TransactionDoc, "id">;
    return { status: data.status, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { status: null, error: err.message || "Failed to fetch payment status." };
  }
}

export async function getPaymentsByCustomer(customerId: string) {
  const { transactions } = await getAllTransactions();
  return {
    payments: transactions.filter((t) => t.userId === customerId && t.type === "customer_contact_unlock"),
    error: null,
  };
}

export async function createRazorpayOrder(amount: number) {
  const { orderId } = await createPaymentOrder("", "customer_contact_unlock", amount);
  return { orderId, error: null };
}

export async function processPayment(options: {
  amount: number;
  name: string;
  description: string;
  orderId: string;
  onSuccess?: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => Promise<void>;
  onFailure?: (error: string) => void;
}) {
  if (options.onSuccess) {
    await options.onSuccess({
      razorpay_payment_id: options.orderId,
      razorpay_order_id: options.orderId,
    });
  }
  return { success: true, orderId: options.orderId };
}

export async function savePaymentRecord(payload: Record<string, unknown> | PaymentRecord) {
  return { id: "", error: null };
}
