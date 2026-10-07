"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { AlertCircle, ArrowLeft, Calendar, Clock, MapPin, DollarSign, User } from "lucide-react";
import { getBookingById, updateBookingStatus } from "@/services/bookingService";
import { BookingDoc } from "@/types/firestore";
import StatusTimeline from "@/components/booking/StatusTimeline";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      notFound();
      return;
    }

    const fetchBooking = async () => {
      const { booking: fetchedBooking, error } = await getBookingById(id);
      if (error || !fetchedBooking) {
        setError(error || "Booking not found.");
      } else {
        setBooking(fetchedBooking);
      }
      setLoading(false);
    };

    fetchBooking();
  }, [id]);

  const handleStatusUpdate = async (status: BookingDoc["status"]) => {
    if (!booking || actionLoading) return;
    setActionLoading(true);
    setError(null);
    const { error: updateError } = await updateBookingStatus(booking.id, status);
    if (updateError) {
      setError(updateError);
    } else {
      setBooking((prev) => (prev ? { ...prev, status, updatedAt: new Date() } : prev));
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-text mb-2">Booking not found</h1>
            <p className="text-text-secondary mb-6">The booking you are looking for does not exist or has been removed.</p>
            <Link href="/search">
              <Button variant="primary">Find Workers</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const isCustomer = user?.uid === booking.customerId;
  const isWorker = user?.uid === booking.workerId;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link href={isCustomer ? "/customer-dashboard" : "/worker-dashboard"}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold font-heading text-text mb-1">{booking.service}</h1>
                <p className="text-sm text-text-secondary">
                  Booking #{booking.id.slice(0, 8)}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === "completed"
                    ? "success"
                    : booking.status === "accepted" || booking.status === "confirmed"
                    ? "primary"
                    : booking.status === "pending"
                    ? "warning"
                    : "danger"
                }
              >
                {booking.status.replace("-", " ")}
              </Badge>
            </div>

            <StatusTimeline booking={booking} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Customer</p>
                  <p className="font-medium text-text">{booking.customerName || "Customer"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-50 dark:bg-success-950 rounded-xl flex items-center justify-center text-success">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Date</p>
                  <p className="font-medium text-text">{booking.date}</p>
                </div>
              </div>
              {booking.time && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-50 dark:bg-warning-950 rounded-xl flex items-center justify-center text-warning">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Time</p>
                    <p className="font-medium text-text">{booking.time}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-950 rounded-xl flex items-center justify-center text-secondary">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Amount</p>
                  <p className="font-medium text-text">{formatCurrency(booking.totalAmount)}</p>
                </div>
              </div>
              {booking.address && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Address</p>
                    <p className="font-medium text-text">{booking.address}</p>
                  </div>
                </div>
              )}
            </div>

            {booking.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-text mb-2">Description</h3>
                <p className="text-sm text-text-secondary bg-surface-alt rounded-xl p-4">
                  {booking.description}
                </p>
              </div>
            )}
          </motion.div>

          {isWorker && booking.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4">Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate("accepted")}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  Accept Booking
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusUpdate("rejected")}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  Decline
                </Button>
              </div>
            </motion.div>
          )}

          {isWorker && booking.status === "accepted" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4">Actions</h3>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate("in-progress")}
                isLoading={actionLoading}
                disabled={actionLoading}
              >
                Start Service
              </Button>
            </motion.div>
          )}

          {isWorker && booking.status === "in-progress" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4">Actions</h3>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate("completed")}
                isLoading={actionLoading}
                disabled={actionLoading}
              >
                Mark Complete
              </Button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-danger/10 border border-danger/20 text-danger rounded-2xl p-4 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
