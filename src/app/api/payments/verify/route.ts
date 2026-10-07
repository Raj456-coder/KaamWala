import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { initAdmin, adminDb, verifyIdToken } from "@/lib/firebaseAdmin";

/**
 * Normalizes a phone number to standard E.164 (+91XXXXXXXXXX for India)
 * and generates the corresponding WhatsApp URL (https://wa.me/91XXXXXXXXXX).
 */
function formatWorkerContact(rawPhone: string): { phoneNumber: string; whatsappUrl: string } | null {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  if (digits.length === 10) {
    digits = "91" + digits;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return {
      phoneNumber: `+${digits}`,
      whatsappUrl: `https://wa.me/${digits}`,
    };
  }

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
    await initAdmin();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Server database configuration error" },
        { status: 500 }
      );
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment provider not configured. Set RAZORPAY_KEY_SECRET in your environment.",
        },
        { status: 503 }
      );
    }

    // Optional Firebase Auth authentication from header
    let customerId: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decodedToken = await verifyIdToken(authHeader.substring(7));
        customerId = decodedToken.uid;
      } catch {
        // Fall back to looking up customer from the transaction document
      }
    }

    const body = await request.json().catch(() => ({}));
    const orderId = body.razorpay_order_id || body.orderId || body.razorpayOrderId;
    const paymentId = body.razorpay_payment_id || body.paymentId || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.signature || body.razorpaySignature;
    const workerId = body.workerId;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
        },
        { status: 400 }
      );
    }

    // 1. Verify HMAC-SHA256 signature server-side using crypto
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      // Mark transaction as failed if it exists
      try {
        await adminDb.collection("transactions").doc(orderId).update({
          status: "failed",
          verificationError: "Signature mismatch",
          updatedAt: new Date(),
        });
      } catch {
        // Document might not exist under this ID
      }

      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 2. Fetch existing transaction record to correlate customer and worker
    const txRef = adminDb.collection("transactions").doc(orderId);
    const txSnap = await txRef.get();
    const txData = txSnap.exists ? txSnap.data() : null;

    const effectiveCustomerId = customerId || txData?.customerId || txData?.userId;
    const effectiveWorkerId = workerId || txData?.workerId || txData?.notes?.workerId;

    if (!effectiveCustomerId || !effectiveWorkerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to correlate payment with customer and worker.",
        },
        { status: 400 }
      );
    }

    // 3. Run Firebase Admin batch:
    //    a) Mark Firestore transactions document as "success" with paymentId
    //    b) Create/Update document in contactUnlocks with { customerId, workerId, amount: 10, paymentId, status: "success", unlockedAt: new Date() }
    const batch = adminDb.batch();
    const now = new Date();

    batch.set(
      txRef,
      {
        transactionId: orderId,
        orderId,
        razorpayOrderId: orderId,
        paymentId,
        razorpayPaymentId: paymentId,
        userId: effectiveCustomerId,
        customerId: effectiveCustomerId,
        workerId: effectiveWorkerId,
        type: "customer_contact_unlock",
        amount: 10,
        currency: "INR",
        status: "success",
        updatedAt: now,
      },
      { merge: true }
    );

    // Check if an existing contactUnlocks record exists for this customer & worker
    const existingUnlockQuery = await adminDb
      .collection("contactUnlocks")
      .where("customerId", "==", effectiveCustomerId)
      .where("workerId", "==", effectiveWorkerId)
      .limit(1)
      .get();

    let unlockDocRef;
    if (!existingUnlockQuery.empty) {
      unlockDocRef = existingUnlockQuery.docs[0].ref;
      batch.update(unlockDocRef, {
        status: "success",
        amount: 10,
        currency: "INR",
        unlockType: "paid",
        paymentId,
        orderId,
        unlockedAt: now,
        updatedAt: now,
      });
    } else {
      unlockDocRef = adminDb.collection("contactUnlocks").doc();
      batch.set(unlockDocRef, {
        customerId: effectiveCustomerId,
        workerId: effectiveWorkerId,
        amount: 10,
        currency: "INR",
        unlockType: "paid",
        status: "success",
        paymentId,
        orderId,
        unlockedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create system notification for customer
    batch.set(adminDb.collection("notifications").doc(), {
      recipientId: effectiveCustomerId,
      type: "contact_unlocked",
      title: "Contact Unlocked",
      message: "You have unlocked a worker's contact.",
      relatedId: unlockDocRef.id,
      read: false,
      createdAt: now,
    });

    await batch.commit();

    // 4. Fetch worker phone number securely via Admin SDK
    const workerSnap = await adminDb.collection("workers").doc(effectiveWorkerId).get();
    let workerData = workerSnap.exists ? workerSnap.data() : null;

    if (!workerData) {
      const userSnap = await adminDb.collection("users").doc(effectiveWorkerId).get();
      if (userSnap.exists) {
        workerData = userSnap.data();
      }
    }

    const rawPhone = workerData?.personalInfo?.phone || workerData?.phone || "";
    const contact = formatWorkerContact(rawPhone);

    return NextResponse.json({
      success: true,
      phoneNumber: contact?.phoneNumber || rawPhone,
      whatsappUrl: contact?.whatsappUrl || `https://wa.me/${rawPhone.replace(/\D/g, "")}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
