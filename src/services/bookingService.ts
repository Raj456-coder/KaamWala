import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingDoc, ReviewDoc, WorkerDoc, WorkerScheduleDoc } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";
import { Coordinates, haversineDistance } from "@/lib/location";

export async function createBooking(
  booking: Omit<BookingDoc, "id" | "createdAt" | "updatedAt">
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const workerRef = doc(db, "workers", booking.workerId);
    const workerSnap = await getDoc(workerRef);
    if (workerSnap.exists()) {
      const workerData = workerSnap.data() as Partial<WorkerDoc>;
      if (workerData.verificationStatus === "suspended") {
        return { id: "", error: "This worker is currently suspended and cannot accept new bookings." };
      }
    }

    const bookingsRef = collection(db, "bookings");
    const now = new Date();
    const docRef = await addDoc(bookingsRef, sanitizeForFirestore({
      ...booking,
      createdAt: now,
      updatedAt: now,
    }));

    await createNotification(
      booking.workerId,
      "booking_created",
      "New booking request",
      `${booking.customerName || "A customer"} booked ${booking.service} on ${booking.date}.`,
      docRef.id
    );

    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: "", error: error instanceof Error ? error.message : "Failed to create booking." };
  }
}

export async function getBookingsByCustomer(
  customerId: string
): Promise<{ bookings: BookingDoc[]; error: string | null }> {
  if (!db) {
    return { bookings: [], error: "Firestore is not available." };
  }

  try {
    const q = query(collection(db, "bookings"), where("customerId", "==", customerId));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<BookingDoc, "id">),
    }));
    return { bookings, error: null };
  } catch (error) {
    return { bookings: [], error: error instanceof Error ? error.message : "Failed to fetch bookings." };
  }
}

export async function getBookingsByWorker(
  workerId: string
): Promise<{ bookings: BookingDoc[]; error: string | null }> {
  if (!db) {
    return { bookings: [], error: "Firestore is not available." };
  }

  try {
    const q = query(collection(db, "bookings"), where("workerId", "==", workerId));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<BookingDoc, "id">),
    }));
    return { bookings, error: null };
  } catch (error) {
    return { bookings: [], error: error instanceof Error ? error.message : "Failed to fetch bookings." };
  }
}

export async function getBookingById(
  id: string
): Promise<{ booking: BookingDoc | null; error: string | null }> {
  if (!db) {
    return { booking: null, error: "Firestore is not available." };
  }

  try {
    const bookingDoc = await getDoc(doc(db, "bookings", id));
    if (!bookingDoc.exists()) {
      return { booking: null, error: "Booking not found." };
    }
    return { booking: { id: bookingDoc.id, ...(bookingDoc.data() as Omit<BookingDoc, "id">) }, error: null };
  } catch (error) {
    return { booking: null, error: error instanceof Error ? error.message : "Failed to fetch booking." };
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingDoc["status"]
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const bookingRef = doc(db, "bookings", id);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) {
      return { error: "Booking not found." };
    }
    const bookingData = bookingSnap.data() as Omit<BookingDoc, "id">;

    await updateDoc(bookingRef, sanitizeForFirestore({
      status,
      updatedAt: new Date(),
    }));

    const notificationPromises: Promise<{ id: string; error: string | null }>[] = [];

    switch (status) {
      case "accepted":
        notificationPromises.push(
          createNotification(
            bookingData.customerId,
            "booking_accepted",
            "Booking accepted",
            `Your booking for ${bookingData.service} has been accepted by the worker.`,
            id
          )
        );
        break;
      case "rejected":
        notificationPromises.push(
          createNotification(
            bookingData.customerId,
            "booking_rejected",
            "Booking declined",
            `Your booking request for ${bookingData.service} was declined.`,
            id
          )
        );
        break;
      case "cancelled":
        notificationPromises.push(
          createNotification(
            bookingData.workerId,
            "booking_cancelled",
            "Booking cancelled",
            `A booking for ${bookingData.service} has been cancelled by the customer.`,
            id
          )
        );
        break;
      case "completed":
        notificationPromises.push(
          createNotification(
            bookingData.customerId,
            "booking_completed",
            "Service completed",
            `Your service ${bookingData.service} has been marked as completed.`,
            id
          )
        );
        break;
      default:
        break;
    }

    await Promise.all(notificationPromises);
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update booking status." };
  }
}

export async function addReviewToBooking(
  bookingId: string,
  rating: number,
  comment: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return { error: "Booking not found." };
    }

    const bookingData = bookingDoc.data() as Omit<BookingDoc, "id">;
    if (bookingData.status !== "completed") {
      return { error: "Cannot review a booking that is not completed." };
    }

    const reviewsRef = collection(bookingRef, "reviews");
    await addDoc(reviewsRef, sanitizeForFirestore({
      rating,
      comment,
      createdAt: new Date(),
    }));

    await createNotification(
      bookingData.workerId,
      "review_received",
      "New review received",
      `You received a new review for ${bookingData.service}.`,
      bookingId
    );

    const reviewsSnapshot = await getDocs(reviewsRef);
    const reviews = reviewsSnapshot.docs.map((d) => d.data() as ReviewDoc);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    const workerRef = doc(db, "workers", bookingData.workerId);
    await updateDoc(workerRef, sanitizeForFirestore({
      rating: avgRating,
      reviewCount: reviews.length,
      updatedAt: new Date(),
    }));

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add review." };
  }
}

export async function getReviewsByBooking(
  bookingId: string
): Promise<{ reviews: ReviewDoc[]; error: string | null }> {
  if (!db) {
    return { reviews: [], error: "Firestore is not available." };
  }

  try {
    const reviewsRef = collection(doc(db, "bookings", bookingId), "reviews");
    const snapshot = await getDocs(reviewsRef);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ReviewDoc, "id">),
    }));
    return { reviews, error: null };
  } catch (error) {
    return { reviews: [], error: error instanceof Error ? error.message : "Failed to fetch reviews." };
  }
}

/**
 * Generates a random 4-digit numeric OTP for service verification
 */
export function generateBookingOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Cross-checks with Firestore `worker_schedules` and active bookings to retrieve booked 30-min slots
 */
export async function getWorkerBookedSlots(
  workerId: string,
  date: string
): Promise<{ bookedSlots: string[]; error: string | null }> {
  if (!db) return { bookedSlots: [], error: "Firestore is not available." };

  try {
    const slotsSet = new Set<string>();

    // 1. Check `worker_schedules` document
    try {
      const scheduleDocId = `${workerId}_${date}`;
      const scheduleSnap = await getDoc(doc(db, "worker_schedules", scheduleDocId));
      if (scheduleSnap.exists()) {
        const scheduleData = scheduleSnap.data() as Partial<WorkerScheduleDoc>;
        if (Array.isArray(scheduleData.bookedSlots)) {
          scheduleData.bookedSlots.forEach((s) => slotsSet.add(s));
        }
      }
    } catch {
      // Ignore if schedule collection is not initialized yet
    }

    // 2. Cross-check active bookings for this worker on this date
    try {
      const q = query(
        collection(db, "bookings"),
        where("workerId", "==", workerId),
        where("date", "==", date)
      );
      const bookingSnap = await getDocs(q);
      bookingSnap.docs.forEach((d) => {
        const b = d.data() as BookingDoc;
        if (
          b.status !== "cancelled" &&
          b.status !== "rejected" &&
          b.time
        ) {
          slotsSet.add(b.time);
        }
      });
    } catch {
      // Ignore
    }

    return { bookedSlots: Array.from(slotsSet), error: null };
  } catch (error) {
    return {
      bookedSlots: [],
      error: error instanceof Error ? error.message : "Failed to fetch worker schedules.",
    };
  }
}

/**
 * Records a booked slot in Firestore `worker_schedules`
 */
export async function bookWorkerScheduleSlot(
  workerId: string,
  date: string,
  slot: string
): Promise<{ error: string | null }> {
  if (!db) return { error: "Firestore is not available." };

  try {
    const scheduleDocId = `${workerId}_${date}`;
    const scheduleRef = doc(db, "worker_schedules", scheduleDocId);
    let snap;
    try {
      snap = await getDoc(scheduleRef);
    } catch (readErr) {
      console.warn("Worker schedule read warning (non-fatal):", readErr);
      return { error: null };
    }

    const now = new Date();
    try {
      if (snap && snap.exists()) {
        const data = snap.data() as WorkerScheduleDoc;
        const currentSlots = Array.isArray(data.bookedSlots) ? data.bookedSlots : [];
        if (!currentSlots.includes(slot)) {
          await updateDoc(scheduleRef, {
            bookedSlots: [...currentSlots, slot],
            updatedAt: now,
          });
        }
      } else {
        await setDoc(
          scheduleRef,
          sanitizeForFirestore({
            id: scheduleDocId,
            workerId,
            date,
            bookedSlots: [slot],
            createdAt: now,
            updatedAt: now,
          })
        );
      }
    } catch (writeErr) {
      console.warn("Worker schedule write warning (non-fatal):", writeErr);
    }
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update schedule.",
    };
  }
}

/**
 * Creates an On-Demand Aggregator booking with ₹10 platform fee, 4-digit OTP,
 * and 5km geo-broadcast to available nearby workers.
 */
export async function createOnDemandBooking(booking: {
  customerId: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
  workerImage?: string;
  service: string;
  description?: string;
  date: string;
  time?: string;
  address?: string;
  landmark?: string;
  duration?: string;
  coordinates?: { latitude: number; longitude: number };
  isBroadcast?: boolean;
}): Promise<{ id: string; otp: string; broadcastCount: number; error: string | null }> {
  if (!db) return { id: "", otp: "", broadcastCount: 0, error: "Firestore is not available." };

  if (!booking.customerId) {
    return {
      id: "",
      otp: "",
      broadcastCount: 0,
      error: "Authenticated customer UID is required to create a booking. Please log in.",
    };
  }

  try {
    const otp = generateBookingOtp();
    const now = new Date();
    const platformFee = 10; // Strictly ₹10 Platform Fee

    // 1. Location-based GeoQuery: Find workers within 5km matching this service
    let broadcastedWorkerIds: string[] = [];
    if (booking.coordinates?.latitude && booking.coordinates?.longitude) {
      try {
        const workersRef = collection(db, "workers");
        const workersSnap = await getDocs(workersRef);

        const customerCoords: Coordinates = {
          latitude: booking.coordinates.latitude,
          longitude: booking.coordinates.longitude,
        };

        workersSnap.docs.forEach((docSnap) => {
          const w = docSnap.data() as WorkerDoc;
          if (w.isAvailable !== false && w.verificationStatus !== "suspended") {
            const matchesService =
              !booking.service ||
              w.professionalInfo?.category?.toLowerCase().includes(booking.service.toLowerCase()) ||
              w.professionalInfo?.profession?.toLowerCase().includes(booking.service.toLowerCase()) ||
              w.professionalInfo?.skills?.some((s) => s.toLowerCase().includes(booking.service.toLowerCase()));

            if (matchesService && w.serviceArea?.latitude && w.serviceArea?.longitude) {
              const distanceKm = haversineDistance(customerCoords, {
                latitude: w.serviceArea.latitude,
                longitude: w.serviceArea.longitude,
              });
              if (distanceKm <= 5) {
                broadcastedWorkerIds.push(docSnap.id);
              }
            }
          }
        });
      } catch (geoErr) {
        console.warn("GeoQuery broadcast lookup failed, proceeding with direct booking:", geoErr);
      }
    }

    const assignedWorkerId = booking.workerId || (broadcastedWorkerIds[0] || "broadcast");
    const assignedWorkerName = booking.workerName || "On-Demand Broadcast";
    const assignedWorkerImage = booking.workerImage || "";

    const bookingsRef = collection(db, "bookings");
    let docRef;
    try {
      docRef = await addDoc(
        bookingsRef,
        sanitizeForFirestore({
          customerId: booking.customerId,
          customerName: booking.customerName || "Customer",
          workerId: assignedWorkerId,
          workerName: assignedWorkerName,
          workerImage: assignedWorkerImage,
          service: booking.service,
          description: booking.description || "",
          date: booking.date,
          time: booking.time || "Immediate",
          address: booking.address || "",
          landmark: booking.landmark || "",
          duration: booking.duration || "1hr",
          status: "pending",
          platformFee,
          amount: platformFee, // ₹10 charged on checkout
          totalAmount: platformFee,
          earnings: 0, // Full labor charges are paid directly by customer in cash/UPI
          startOtp: otp,
          otpGeneratedAt: now,
          isBroadcast: booking.isBroadcast ?? true,
          broadcastedWorkerIds,
          coordinates: booking.coordinates,
          createdAt: now,
          updatedAt: now,
        })
      );
    } catch (firestoreErr: unknown) {
      const errMsg = firestoreErr instanceof Error ? firestoreErr.message : String(firestoreErr);
      console.error("Firestore booking addDoc error:", firestoreErr);
      if (errMsg.includes("permission") || errMsg.includes("Missing or insufficient permissions")) {
        return {
          id: "",
          otp: "",
          broadcastCount: 0,
          error: "Permission denied by Firebase Firestore. Please ensure you are logged in and have permissions to create bookings.",
        };
      }
      return {
        id: "",
        otp: "",
        broadcastCount: 0,
        error: `Database error: ${errMsg}`,
      };
    }

    // 2. Lock time slot in schedule if a specific worker was chosen
    if (booking.workerId && booking.workerId !== "broadcast" && booking.date && booking.time) {
      try {
        await bookWorkerScheduleSlot(booking.workerId, booking.date, booking.time);
      } catch (schedErr) {
        console.warn("Schedule slot update failed (non-blocking):", schedErr);
      }
    }

    // 3. Dispatch simulated SMS to feature-phone workers via dummy webhook
    try {
      fetch("/api/broadcast/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: docRef.id,
          service: booking.service,
          time: booking.time || "Immediate",
          address: booking.address || booking.landmark || "Customer Location",
          workerCount: broadcastedWorkerIds.length,
        }),
      }).catch(() => {
        // Silent fail for SMS webhook
      });
    } catch {
      // Ignore
    }

    // 4. Notify assigned or broadcasted workers
    if (booking.workerId && booking.workerId !== "broadcast") {
      try {
        await createNotification(
          booking.workerId,
          "booking_created",
          "New On-Demand Booking",
          `${booking.customerName || "A customer"} booked ${booking.service} for ${booking.time}. Platform fee paid.`,
          docRef.id
        );
      } catch (notifErr) {
        console.warn("Notification creation failed (non-blocking):", notifErr);
      }
    }

    return {
      id: docRef.id,
      otp,
      broadcastCount: broadcastedWorkerIds.length,
      error: null,
    };
  } catch (error) {
    return {
      id: "",
      otp: "",
      broadcastCount: 0,
      error: error instanceof Error ? error.message : "Failed to create on-demand booking.",
    };
  }
}

/**
 * Worker verifies the Customer's 4-digit OTP to transition booking status to "in-progress"
 */
export async function verifyBookingOtp(
  bookingId: string,
  enteredOtp: string,
  workerId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!db) return { success: false, error: "Firestore is not available." };

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) {
      return { success: false, error: "Booking not found." };
    }

    const booking = snap.data() as BookingDoc;

    if (!booking.startOtp) {
      return { success: false, error: "No start OTP was generated for this booking." };
    }

    if (booking.startOtp.trim() !== enteredOtp.trim()) {
      return { success: false, error: "Invalid 4-digit OTP. Please ask the customer for the correct code shown on their screen." };
    }

    const now = new Date();
    await updateDoc(bookingRef, {
      status: "in-progress",
      otpVerifiedAt: now,
      updatedAt: now,
    });

    await createNotification(
      booking.customerId,
      "booking_started",
      "Service In Progress",
      `Your worker has verified the OTP. Service for ${booking.service} is now in progress!`,
      bookingId
    );

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify OTP.",
    };
  }
}

/**
 * 10-Minute Cancellation Countdown & Wallet Refund:
 * - If canceled within 10 minutes: +₹5 to customer's walletBalance in Firestore.
 * - If after 10 minutes: cancels with no refund.
 */
export async function cancelBookingWithRefund(
  bookingId: string,
  customerId: string
): Promise<{ success: boolean; refundAmount: number; message: string; error: string | null }> {
  if (!db) return { success: false, refundAmount: 0, message: "", error: "Firestore is not available." };

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) {
      return { success: false, refundAmount: 0, message: "", error: "Booking not found." };
    }

    const booking = snap.data() as BookingDoc;
    if (booking.status === "cancelled") {
      return { success: false, refundAmount: 0, message: "Booking is already cancelled.", error: null };
    }

    const now = new Date();
    const createdTime = booking.createdAt instanceof Date ? booking.createdAt.getTime() : new Date(booking.createdAt).getTime();
    const elapsedMinutes = (now.getTime() - createdTime) / (1000 * 60);

    const isEligibleForRefund = elapsedMinutes <= 10;
    const refundAmount = isEligibleForRefund ? 5 : 0;
    const refundStatus = isEligibleForRefund ? "credited_to_wallet" : "no_refund_after_10min";

    // Update booking status
    await updateDoc(bookingRef, {
      status: "cancelled",
      cancellationRefund: refundAmount,
      refundStatus,
      updatedAt: now,
    });

    // If eligible, update customer's wallet balance in Firestore
    if (isEligibleForRefund) {
      try {
        const userRef = doc(db, "users", customerId);
        await updateDoc(userRef, {
          walletBalance: increment(5),
          updatedAt: now,
        });
      } catch {
        // Fallback check on customers collection
        try {
          const custRef = doc(db, "customers", customerId);
          await updateDoc(custRef, {
            walletBalance: increment(5),
            updatedAt: now,
          });
        } catch {
          // Ignore
        }
      }
    }

    // Notify worker
    if (booking.workerId && booking.workerId !== "broadcast") {
      await createNotification(
        booking.workerId,
        "booking_cancelled",
        "Booking Cancelled",
        `Booking for ${booking.service} was cancelled by the customer.`,
        bookingId
      );
    }

    const message = isEligibleForRefund
      ? "Booking cancelled within 10 minutes. ₹5 refund has been credited to your KaamWala Wallet!"
      : "Booking cancelled. Since cancellation occurred after 10 minutes, no platform fee refund is applicable.";

    return {
      success: true,
      refundAmount,
      message,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      refundAmount: 0,
      message: "",
      error: error instanceof Error ? error.message : "Failed to cancel booking.",
    };
  }
}

/**
 * Queries active on-demand broadcasts matching worker category or within 5km radius
 */
export async function getBroadcastBookingsForWorker(
  workerId: string,
  workerCategory?: string,
  workerCoords?: Coordinates
): Promise<{ bookings: BookingDoc[]; error: string | null }> {
  if (!db) return { bookings: [], error: "Firestore is not available." };

  try {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);

    const activeBroadcasts = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<BookingDoc, "id">) }))
      .filter((b) => {
        // 1. Direct inclusion in broadcastedWorkerIds
        if (Array.isArray(b.broadcastedWorkerIds) && b.broadcastedWorkerIds.includes(workerId)) {
          return true;
        }

        // 2. Category match + 5km radius check
        const categoryMatch =
          !workerCategory ||
          b.service.toLowerCase().includes(workerCategory.toLowerCase()) ||
          workerCategory.toLowerCase().includes(b.service.toLowerCase());

        if (!categoryMatch) return false;

        if (workerCoords && b.coordinates?.latitude && b.coordinates?.longitude) {
          const distance = haversineDistance(workerCoords, {
            latitude: b.coordinates.latitude,
            longitude: b.coordinates.longitude,
          });
          return distance <= 5;
        }

        return b.isBroadcast === true;
      });

    return { bookings: activeBroadcasts, error: null };
  } catch (error) {
    return {
      bookings: [],
      error: error instanceof Error ? error.message : "Failed to fetch broadcasts.",
    };
  }
}

/**
 * Worker accepts an on-demand broadcast booking
 */
export async function acceptBroadcastBooking(
  bookingId: string,
  workerId: string,
  workerName: string,
  workerImage?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!db) return { success: false, error: "Firestore is not available." };

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const snap = await getDoc(bookingRef);

    if (!snap.exists()) {
      return { success: false, error: "Booking not found." };
    }

    const booking = snap.data() as BookingDoc;
    if (booking.status !== "pending") {
      return { success: false, error: "This booking has already been accepted by another worker." };
    }

    const now = new Date();
    await updateDoc(bookingRef, {
      workerId,
      workerName,
      workerImage: workerImage || "",
      status: "accepted",
      updatedAt: now,
    });

    await createNotification(
      booking.customerId,
      "booking_accepted",
      "Worker Assigned!",
      `${workerName} has accepted your on-demand request for ${booking.service}!`,
      bookingId
    );

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to accept booking.",
    };
  }
}

