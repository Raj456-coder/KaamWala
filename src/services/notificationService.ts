import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NotificationDoc, NotificationType } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<{ id: string; error: string | null }> {
  if (!db) {
    return { id: "", error: "Firestore is not available." };
  }

  try {
    const notificationsRef = collection(db, "notifications");
    const docRef = await addDoc(notificationsRef, sanitizeForFirestore({
      recipientId,
      type,
      title,
      message,
      relatedId,
      read: false,
      createdAt: new Date(),
    }));
    return { id: docRef.id, error: null };
  } catch (error: unknown) {
    return { id: "", error: (error as Error).message || "Failed to create notification." };
  }
}

export async function getNotifications(
  userId: string
): Promise<{ notifications: NotificationDoc[]; error: string | null }> {
  if (!db) {
    return { notifications: [], error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<NotificationDoc, "id">),
    }));
    return { notifications, error: null };
  } catch (error: unknown) {
    return {
      notifications: [],
      error: (error as Error).message || "Failed to fetch notifications.",
    };
  }
}

export async function markAsRead(
  notificationId: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
    return { error: null };
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to mark notification as read.",
    };
  }
}

export async function markAllAsRead(
  userId: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(updatePromises);
    return { error: null };
  } catch (error: unknown) {
    return {
      error: (error as Error).message || "Failed to mark all notifications as read.",
    };
  }
}

export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error: string | null }> {
  if (!db) {
    return { count: 0, error: "Firestore is not available." };
  }

  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return { count: snapshot.size, error: null };
  } catch (error: unknown) {
    return { count: 0, error: (error as Error).message || "Failed to fetch unread count." };
  }
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error: string | null }> {
  void to;
  void subject;
  void message;
  return {
    success: false,
    error: "Email provider not configured. Connect an email service to enable email notifications.",
  };
}

export async function sendPushNotification(
  userId: string,
  title: string,
  message: string
): Promise<{ success: boolean; error: string | null }> {
  void userId;
  void title;
  void message;
  return {
    success: false,
    error: "Push notification provider not configured.",
  };
}
