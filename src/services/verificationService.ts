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
import { WorkerVerificationDoc, AuditLogDoc, WorkerVerificationStatus } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";

const now = () => new Date();

export async function getVerificationByWorkerId(
  workerId: string
): Promise<{ verification: WorkerVerificationDoc | null; error: string | null }> {
  if (!db) {
    return { verification: null, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "workerVerifications"),
      where("workerId", "==", workerId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { verification: null, error: null };
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as Omit<WorkerVerificationDoc, "id">;
    return { verification: { id: docSnap.id, ...data }, error: null };
  } catch (error: unknown) {
    return { verification: null, error: (error as Error).message || "Failed to fetch verification." };
  }
}

export async function createOrUpdateVerification(
  workerId: string,
  status: WorkerVerificationStatus,
  options?: {
    reviewedBy?: string;
    rejectionReason?: string;
    adminNotes?: string;
    documentReferences?: string[];
  }
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const { verification } = await getVerificationByWorkerId(workerId);
    const existingId = verification?.id;
    const docRef = existingId ? doc(db, "workerVerifications", existingId) : doc(collection(db, "workerVerifications"));

    const payload: WorkerVerificationDoc = {
      id: existingId || docRef.id,
      workerId,
      status,
      submittedAt: verification?.submittedAt || now(),
      reviewedAt: options?.reviewedBy ? now() : verification?.reviewedAt,
      reviewedBy: options?.reviewedBy || verification?.reviewedBy,
      rejectionReason: options?.rejectionReason || verification?.rejectionReason,
      adminNotes: options?.adminNotes || verification?.adminNotes,
      documentReferences: options?.documentReferences || verification?.documentReferences || [],
      createdAt: verification?.createdAt || now(),
      updatedAt: now(),
    };

    await setDoc(docRef, sanitizeForFirestore(payload));

    await updateWorkerVerificationStatus(workerId, status);

    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    return { id: "", error: (error as Error).message || "Failed to save verification." };
  }
}

export async function getVerificationQueue(): Promise<{ verifications: WorkerVerificationDoc[]; error: string | null }> {
  if (!db) {
    return { verifications: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "workerVerifications"),
      where("status", "in", ["pending", "under_review"]),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const verifications = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<WorkerVerificationDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { verifications, error: null };
  } catch (error: unknown) {
    return { verifications: [], error: (error as Error).message || "Failed to fetch verification queue." };
  }
}

export async function getAllVerifications(): Promise<{ verifications: WorkerVerificationDoc[]; error: string | null }> {
  if (!db) {
    return { verifications: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(query(collection(db, "workerVerifications"), orderBy("updatedAt", "desc")));
    const verifications = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<WorkerVerificationDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { verifications, error: null };
  } catch (error: unknown) {
    return { verifications: [], error: (error as Error).message || "Failed to fetch verifications." };
  }
}

export async function updateWorkerVerificationStatus(
  workerId: string,
  status: WorkerVerificationStatus
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const workerRef = doc(db, "workers", workerId);
    const workerSnap = await getDoc(workerRef);
    if (!workerSnap.exists()) {
      return { error: "Worker not found." };
    }

    await updateDoc(workerRef, sanitizeForFirestore({
      verificationStatus: status,
      isVerified: status === "verified",
      updatedAt: now(),
    }));

    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to update worker verification status." };
  }
}

export async function suspendWorker(
  workerId: string,
  adminId: string,
  reason: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const workerRef = doc(db, "workers", workerId);
    await updateDoc(workerRef, sanitizeForFirestore({
      verificationStatus: "suspended",
      isAvailable: false,
      isVerified: false,
      suspension: {
        suspendedAt: now(),
        suspendedBy: adminId,
        reason,
      },
      updatedAt: now(),
    }));

    await createAuditLog(adminId, "suspend_worker", "worker", workerId, reason);

    await createNotification(
      workerId,
      "system",
      "Account suspended",
      "Your worker account has been suspended. Please contact support for more information.",
      workerId
    );

    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to suspend worker." };
  }
}

export async function reactivateWorker(
  workerId: string,
  adminId: string,
  reason?: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const workerRef = doc(db, "workers", workerId);
    await updateDoc(workerRef, sanitizeForFirestore({
      verificationStatus: "pending",
      isAvailable: true,
      isVerified: false,
      suspension: null,
      updatedAt: now(),
    }));

    await createAuditLog(adminId, "reactivate_worker", "worker", workerId, reason);

    await createNotification(
      workerId,
      "system",
      "Account reactivated",
      "Your worker account has been reactivated. Please complete any pending verification steps.",
      workerId
    );

    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to reactivate worker." };
  }
}

export async function createAuditLog(
  adminId: string,
  action: string,
  targetType: AuditLogDoc["targetType"],
  targetId: string,
  reason?: string
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const docRef = doc(collection(db, "auditLogs"));
    const payload: AuditLogDoc = {
      id: docRef.id,
      adminId,
      action,
      targetType,
      targetId,
      reason,
      createdAt: now(),
    };
    await setDoc(docRef, sanitizeForFirestore(payload));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    return { id: "", error: (error as Error).message || "Failed to create audit log." };
  }
}

export async function getAuditLogs(limitCount = 100): Promise<{ logs: AuditLogDoc[]; error: string | null }> {
  if (!db) {
    return { logs: [], error: "Firestore is not available." };
  }

  try {
    const q = query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<AuditLogDoc, "id">;
      return { id: doc.id, ...data };
    });
    return { logs, error: null };
  } catch (error: unknown) {
    return { logs: [], error: (error as Error).message || "Failed to fetch audit logs." };
  }
}
