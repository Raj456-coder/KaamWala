import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  TransactionDoc,
  TransactionType,
  TransactionStatus,
} from "@/types/monetization";
import { PaymentRecord } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";
import { getTransactionsByUserId } from "./monetizationService";

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

    await setDoc(txRef, sanitizeForFirestore({ ...payload, createdAt: now(), updatedAt: now() }));
    return { orderId: txRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { orderId: "", error: err.message || "Failed to create payment order." };
  }
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
      ...(reason ? { refundReason: reason } : {}),
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
  const { transactions, error } = await getTransactionsByUserId(customerId);
  if (error) {
    return { payments: [], error };
  }
  return {
    payments: transactions.filter((t) => t.type === "customer_contact_unlock"),
    error: null,
  };
}

export async function createRazorpayOrder(amount: number, userId?: string) {
  const { orderId, error } = await createPaymentOrder(userId || "", "customer_contact_unlock", amount);
  return { orderId, error };
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay can only be loaded in the browser"));
      return;
    }
    if ((window as Window & typeof globalThis & { Razorpay?: unknown }).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export interface PaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function processPayment(options: {
  amount: number;
  name: string;
  description: string;
  orderId: string;
  customerId?: string;
  userId?: string;
  unlockId?: string;
  subscriptionId?: string;
  membershipId?: string;
  onSuccess?: (response: PaymentResult) => Promise<void>;
  onFailure?: (error: string) => void;
}): Promise<{ success: boolean; error: string | null }> {
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!razorpayKeyId) {
    const msg = "Payment provider not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.";
    options.onFailure?.(msg);
    return { success: false, error: msg };
  }

  try {
    await loadRazorpayScript();

    const res = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: options.amount,
        currency: "INR",
        orderId: options.orderId,
        customerId: options.customerId || options.userId,
        userId: options.userId || options.customerId,
        unlockId: options.unlockId,
        subscriptionId: options.subscriptionId,
        membershipId: options.membershipId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = data.error || "Failed to create payment order";
      options.onFailure?.(msg);
      return { success: false, error: msg };
    }

    const Razorpay = (window as Window & typeof globalThis & { Razorpay?: { new (config: Record<string, unknown>): { open(): void; } } }).Razorpay;
    if (!Razorpay) {
      const msg = "Razorpay SDK failed to load";
      options.onFailure?.(msg);
      return { success: false, error: msg };
    }

    const rzp = new Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: "KaamWala",
      description: options.description,
      handler: (response: PaymentResult) => {
        void options.onSuccess?.(response);
      },
      prefill: {
        name: options.name,
      },
      theme: { color: "#0ea5e9" },
    });

    rzp.open();
    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    const msg = err.message || "Failed to initialize payment";
    options.onFailure?.(msg);
    return { success: false, error: msg };
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature?: string,
  unlockId?: string,
  customerId?: string,
  extra?: { subscriptionId?: string; membershipId?: string; userId?: string }
): Promise<{
  success: boolean;
  workerPhone?: string | null;
  subscriptionId?: string | null;
  membershipId?: string | null;
  error: string | null;
}> {
  try {
    const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature || "",
        unlockId: unlockId || "",
        customerId: customerId || extra?.userId || "",
        userId: extra?.userId || customerId || "",
        subscriptionId: extra?.subscriptionId || "",
        membershipId: extra?.membershipId || "",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Payment verification failed" };
    }
    return {
      success: true,
      workerPhone: data.workerPhone || null,
      subscriptionId: data.subscriptionId || null,
      membershipId: data.membershipId || null,
      error: null,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to verify payment" };
  }
}

export async function savePaymentRecord(payload: Record<string, unknown> | PaymentRecord) {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "payments"));
    const record: PaymentRecord = {
      ...(payload as PaymentRecord),
      id: docRef.id,
      createdAt: new Date(),
    };
    await setDoc(docRef, sanitizeForFirestore(record));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to save payment record." };
  }
}
