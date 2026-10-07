import { NextRequest, NextResponse } from "next/server";
import { initAdmin, adminDb, verifyIdToken } from "@/lib/firebaseAdmin";
import { CUSTOMER_FREE_CONTACT_UNLOCKS, CONTACT_UNLOCK_PRICE } from "@/lib/launchConfig";

/**
 * Normalizes a phone number to standard E.164 (+91XXXXXXXXXX for India)
 * and generates the corresponding WhatsApp URL (https://wa.me/91XXXXXXXXXX).
 */
function formatWorkerContact(rawPhone: string): { phoneNumber: string; whatsappUrl: string } | null {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  // Extract all numeric digits
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // If 11 digits starting with 0 (e.g. 09876543210), strip the leading 0
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Standard Indian 10-digit mobile number -> prepend country code 91
  if (digits.length === 10) {
    digits = "91" + digits;
  }

  // 12-digit Indian number starting with 91
  if (digits.length === 12 && digits.startsWith("91")) {
    return {
      phoneNumber: `+${digits}`,
      whatsappUrl: `https://wa.me/${digits}`,
    };
  }

  // Fallback for international or non-standard format with >= 10 digits
  if (digits.length >= 10) {
    const formatted = digits.startsWith("91") ? `+${digits}` : `+91${digits.slice(-10)}`;
    const waDigits = formatted.replace("+", "");
    return {
      phoneNumber: formatted,
      whatsappUrl: `https://wa.me/${waDigits}`,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    await initAdmin();

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Server database configuration error" },
        { status: 500 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { workerId } = body;
    if (!workerId || typeof workerId !== "string") {
      return NextResponse.json(
        { success: false, error: "workerId is required" },
        { status: 400 }
      );
    }

    const customerId = decodedToken.uid;

    type TransactionResult =
      | { type: "unlocked"; workerPhone: string }
      | { type: "requires_payment"; amount: number; freeRemaining: number }
      | { type: "worker_not_found" }
      | { type: "no_phone" };

    // Atomic validation & entitlement deduction inside a Firestore transaction
    // to strictly prevent double-spending or race conditions.
    const result = await adminDb.runTransaction<TransactionResult>(async (transaction) => {
      // 1. Fetch worker document securely from private store
      const workerDocRef = adminDb.collection("workers").doc(workerId);
      const workerDocSnap = await transaction.get(workerDocRef);

      let workerData = workerDocSnap.exists ? workerDocSnap.data() : null;
      if (!workerData) {
        const userDocRef = adminDb.collection("users").doc(workerId);
        const userDocSnap = await transaction.get(userDocRef);
        if (userDocSnap.exists) {
          workerData = userDocSnap.data();
        }
      }

      if (!workerData) {
        return { type: "worker_not_found" };
      }

      const rawPhone = workerData?.personalInfo?.phone || workerData?.phone || "";
      if (!rawPhone) {
        return { type: "no_phone" };
      }

      // 2. Check if customer already has an active unlock record for this worker
      const existingUnlockQuery = adminDb
        .collection("contactUnlocks")
        .where("customerId", "==", customerId)
        .where("workerId", "==", workerId)
        .where("status", "==", "success")
        .limit(1);

      const existingUnlockSnap = await transaction.get(existingUnlockQuery);

      if (!existingUnlockSnap.empty) {
        // Customer already unlocked this worker — grant access without deducting credits
        return { type: "unlocked", workerPhone: rawPhone };
      }

      // 3. Count successful free unlocks for the customer
      const freeUnlocksQuery = adminDb
        .collection("contactUnlocks")
        .where("customerId", "==", customerId)
        .where("unlockType", "==", "free")
        .where("status", "==", "success");

      const freeUnlocksSnap = await transaction.get(freeUnlocksQuery);
      const freeCount = freeUnlocksSnap.size;

      if (freeCount >= CUSTOMER_FREE_CONTACT_UNLOCKS) {
        // Free quota exhausted and no active unlock record -> Payment required
        return {
          type: "requires_payment",
          amount: CONTACT_UNLOCK_PRICE,
          freeRemaining: 0,
        };
      }

      // 4. Remaining free unlocks > 0 -> Execute atomic deduction
      const now = new Date();
      const newUnlockRef = adminDb.collection("contactUnlocks").doc();
      const newTxRef = adminDb.collection("transactions").doc();

      transaction.set(newUnlockRef, {
        customerId,
        workerId,
        amount: 0,
        currency: "INR",
        unlockType: "free",
        status: "success",
        unlockedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      transaction.set(newTxRef, {
        transactionId: newTxRef.id,
        userId: customerId,
        type: "customer_contact_unlock",
        amount: 0,
        currency: "INR",
        status: "success",
        referenceId: newUnlockRef.id,
        createdAt: now,
        updatedAt: now,
      });

      return { type: "unlocked", workerPhone: rawPhone };
    });

    if (result.type === "worker_not_found") {
      return NextResponse.json(
        { success: false, error: "Worker not found" },
        { status: 404 }
      );
    }

    if (result.type === "no_phone") {
      return NextResponse.json(
        { success: false, error: "Worker contact phone number is unavailable" },
        { status: 404 }
      );
    }

    if (result.type === "requires_payment") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment required to unlock contact",
          requiresPayment: true,
          amount: result.amount,
          freeRemaining: result.freeRemaining,
        },
        { status: 402 }
      );
    }

    const contact = formatWorkerContact(result.workerPhone);
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Worker contact phone number is improperly formatted" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: contact.phoneNumber,
      whatsappUrl: contact.whatsappUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
