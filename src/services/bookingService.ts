import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingDoc, ReviewDoc, WorkerDoc } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";
import { createNotification } from "./notificationService";

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
