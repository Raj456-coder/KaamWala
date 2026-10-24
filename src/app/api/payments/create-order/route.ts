import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { initAdmin, adminDb, verifyIdToken } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Razorpay credentials
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
          message: "Payment gateway credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        },
        { status: 500 }
      );
    }

    // 2. Initialize official Razorpay Node SDK
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // 3. Parse request body
    const body = await request.json().catch(() => ({}));

    // 4. Authenticate customer if Bearer token is provided
    let customerId = body.customerId || body.userId || "guest";
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.substring(7);
      try {
        await initAdmin();
        if (adminDb) {
          const decodedToken = await verifyIdToken(idToken);
          if (decodedToken?.uid) {
            customerId = decodedToken.uid;
          }
        }
      } catch {
        // Fall back to body customerId if token verification fails
      }
    }

    const workerId = body.workerId || body.notes?.workerId || "general";

    // 5. Razorpay receipts must not exceed 40 characters
    const fullReceipt = `rcpt_${customerId.slice(0, 8)}_${workerId.slice(0, 8)}_${Date.now()}`;
    const receipt = fullReceipt.slice(-40);

    // 6. Determine order amount in paise (default ₹10.00 = 1000 paise for contact unlock)
    let amountInPaise = 1000;
    if (typeof body.amount === "number" && body.amount > 0) {
      amountInPaise = body.amount;
    }

    // 7. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: body.currency || "INR",
      receipt,
      notes: {
        customerId,
        workerId,
        ...(body.notes || {}),
      },
    });

    // 8. Store order record in Firestore `transactions` with status "created"
    if (adminDb) {
      try {
        const now = new Date();
        await adminDb.collection("transactions").doc(order.id).set({
          transactionId: order.id,
          orderId: order.id,
          razorpayOrderId: order.id,
          userId: customerId,
          customerId,
          workerId,
          type: body.type || "customer_contact_unlock",
          amount: typeof order.amount === "number" ? order.amount / 100 : 10,
          currency: order.currency || "INR",
          status: "created",
          receipt,
          notes: {
            customerId,
            workerId,
          },
          createdAt: now,
          updatedAt: now,
        });
      } catch (dbError) {
        console.warn("Failed to store transaction in Firestore:", dbError);
      }
    }

    // 9. Return required payload with orderId, order_id, keyId, key
    return NextResponse.json({
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKeyId,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKeyId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json(
      { success: false, error: message, message },
      { status: 500 }
    );
  }
}
