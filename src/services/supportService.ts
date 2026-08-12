import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  SupportRequestDoc,
  SupportRequestWithId,
  SupportRequestStatus,
} from "@/types/monetization";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";

const now = () => new Date();

export async function createSupportRequest(
  customerId: string,
  workerId: string,
  reason: string,
  description: string,
  relatedUnlockId?: string
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "supportRequests"));
    const payload: SupportRequestDoc = {
      customerId,
      workerId,
      relatedUnlockId,
      reason,
      description,
      status: "open",
      createdAt: now(),
      updatedAt: now(),
    };
    await setDoc(docRef, sanitizeForFirestore(payload));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    const err = error as Error;
    return { id: "", error: err.message || "Failed to create support request." };
  }
}

export async function getAllSupportRequests(): Promise<{ requests: SupportRequestWithId[]; error: string | null }> {
  if (!db) {
    return { requests: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "supportRequests"), orderBy("createdAt", "desc"))
    );
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

export async function getSupportRequestsByCustomer(
  customerId: string
): Promise<{ requests: SupportRequestWithId[]; error: string | null }> {
  if (!db) {
    return { requests: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "supportRequests"),
      where("customerId", "==", customerId),
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
