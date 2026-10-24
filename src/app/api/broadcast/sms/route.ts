import { NextRequest, NextResponse } from "next/server";
import { initAdmin, adminDb } from "@/lib/firebaseAdmin";

/**
 * Dummy SMS Webhook Integration for Feature-Phone Workers (Twilio / Fast2SMS Simulator)
 *
 * 1. Outbound SMS:
 *    Sends SMS notification to non-smartphone/feature-phone workers within 5km radius:
 *    "KaamWala Alert: New Booking for [Service] at [Time]. Address: [Address]. Reply YES to accept."
 *
 * 2. Inbound Webhook Reply:
 *    Receives SMS replies (e.g. Twilio / Fast2SMS webhook with Body: "YES") from worker's phone number
 *    to accept the booking.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Inbound SMS Reply from Worker (e.g. Reply "YES" to accept)
    if (body.From || body.sender || (body.Body && body.Body.toUpperCase().includes("YES"))) {
      const senderPhone = body.From || body.sender || body.phone;
      const bookingId = body.bookingId;

      await initAdmin();
      if (adminDb && bookingId) {
        const bookingRef = adminDb.collection("bookings").doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (bookingSnap.exists) {
          const bookingData = bookingSnap.data();
          if (bookingData?.status === "pending") {
            await bookingRef.update({
              status: "accepted",
              workerPhone: senderPhone || "+91-FeaturePhoneWorker",
              workerName: "Verified Worker (SMS Accepted)",
              updatedAt: new Date(),
            });

            return NextResponse.json({
              success: true,
              mode: "inbound_webhook_reply",
              status: "accepted",
              message: "SMS Reply received: Worker accepted the booking.",
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        mode: "inbound_webhook_reply",
        status: "processed",
      });
    }

    // Outbound SMS Dispatch Simulation to Feature-Phone Workers
    const service = body.service || "Home Service";
    const time = body.time || "Immediate";
    const address = body.address || "Customer Address";
    const bookingId = body.bookingId || "booking_test";
    const workerCount = body.workerCount || 1;

    const smsMessage = `KaamWala Alert: New Booking for ${service} at ${time}. Location: ${address}. Reply YES to accept. Booking #${bookingId.slice(0, 6)}`;

    console.log(`[SMS Gateway Simulated Webhook] Sent to ${workerCount} feature-phone workers:`);
    console.log(`Payload: "${smsMessage}"`);

    return NextResponse.json({
      success: true,
      provider: "Fast2SMS/Twilio Webhook Simulator",
      gatewayStatus: "DELIVERED",
      dispatchedCount: workerCount,
      smsText: smsMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "SMS webhook execution error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
