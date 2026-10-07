import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { initAdmin, adminDb, verifyIdToken } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the requesting customer using Firebase Auth
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

    const customerId = decodedToken.uid;

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const workerId = body.workerId || body.notes?.workerId;

    if (!workerId || typeof workerId !== "string") {
      return NextResponse.json(
        { success: false, error: "workerId is required" },
        { status: 400 }
      );
    }

    // 3. Initialize official Razorpay Node SDK
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // 4. Razorpay receipts must not exceed 40 characters
    const fullReceipt = `receipt_unlock_${customerId}_${workerId}_${Date.now()}`;
    const receipt = fullReceipt.length <= 40 ? fullReceipt : fullReceipt.slice(-40);

    // 5. Create order with ₹10.00 (1000 paise)
    const order = await razorpay.orders.create({
      amount: 1000,
      currency: "INR",
      receipt,
      notes: {
        customerId,
        workerId,
      },
    });

    // 6. Store order record in Firestore `transactions` with status "created"
    const now = new Date();
    await adminDb.collection("transactions").doc(order.id).set({
      transactionId: order.id,
      orderId: order.id,
      razorpayOrderId: order.id,
      userId: customerId,
      customerId,
      workerId,
      type: "customer_contact_unlock",
      amount: 10,
      currency: "INR",
      status: "created",
      receipt,
      notes: {
        customerId,
        workerId,
      },
      createdAt: now,
      updatedAt: now,
    });

    // 7. Return required payload
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKeyId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
