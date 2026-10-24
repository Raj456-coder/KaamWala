import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

/**
 * Task 3: Dedicated /api/create-order route.
 * Handles Razorpay order creation strictly using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
 * from environment variables without any unauthorized Firebase client SDK calls.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Retrieve credentials strictly from server environment variables
    const key_id =
      process.env.RAZORPAY_KEY_ID?.trim() ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!key_id || !key_secret) {
      console.error("[/api/create-order] Server missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local");
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway credentials not configured on server. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.",
        },
        { status: 500 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));

    // 3. Calculate amount strictly in paise (₹10 = 1000 paise)
    let amountInPaise = 1000;
    if (typeof body.amount === "number" && body.amount > 0) {
      // If amount passed is >= 100 assume paise; if < 100 assume rupees
      amountInPaise = body.amount >= 100 ? Math.round(body.amount) : Math.round(body.amount * 100);
    }

    const currency = body.currency || "INR";
    const customerId = (body.customerId || body.userId || "customer").toString();
    const receipt = `rcpt_${customerId.slice(0, 10)}_${Date.now()}`.slice(-40);

    // 4. Initialize Razorpay official Node SDK
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // 5. Create Razorpay order (no client Firestore SDK calls here)
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        customerId,
        service: body.service || "On-Demand Service",
        type: body.type || "platform_booking_fee",
      },
    });

    console.log("[/api/create-order] Created Razorpay order:", order.id, "Amount (paise):", order.amount);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
      key: key_id,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create Razorpay order";
    console.error("[/api/create-order Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
