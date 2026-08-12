import { WorkerProfile } from "@/types";
import { DEMO_WORKERS, DEMO_BOOKINGS, DEMO_STATS } from "@/constants/demoData";
import { AdminStats, BookingDoc } from "@/types/firestore";

export async function getDemoWorkers(limit?: number): Promise<{ workers: WorkerProfile[]; error: null }> {
  const workers = limit ? DEMO_WORKERS.slice(0, limit) : DEMO_WORKERS;
  return { workers, error: null };
}

export async function getDemoBookings(customerId?: string): Promise<{ bookings: BookingDoc[]; error: null }> {
  if (customerId) {
    const bookings = DEMO_BOOKINGS.filter((b) => b.customerId === customerId);
    return { bookings, error: null };
  }
  return { bookings: DEMO_BOOKINGS, error: null };
}

export async function getDemoBookingById(id: string): Promise<{ booking: BookingDoc | null; error: null }> {
  const booking = DEMO_BOOKINGS.find((b) => b.id === id);
  return { booking: booking || null, error: null };
}

export async function getDemoStats(): Promise<{ stats: AdminStats; error: null }> {
  return { stats: DEMO_STATS, error: null };
}

export const DEMO_USERS = [
  {
    uid: "demo-user-1",
    email: "customer@demo.com",
    name: "Demo Customer",
    role: "customer" as const,
    photoURL: "https://ui-avatars.com/api/?name=Demo+Customer&background=3b82f6&color=fff",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    uid: "demo-user-2",
    email: "worker@demo.com",
    name: "Demo Worker",
    role: "worker" as const,
    photoURL: "https://ui-avatars.com/api/?name=Demo+Worker&background=10b981&color=fff",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
];
