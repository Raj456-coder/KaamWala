"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  KeyRound,
  ShieldCheck,
  Timer,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import {
  getBookingById,
  updateBookingStatus,
  verifyBookingOtp,
  cancelBookingWithRefund,
} from "@/services/bookingService";
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

  // OTP Verification state (for worker)
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Countdown timer state (for customer)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [refundMessage, setRefundMessage] = useState<string | null>(null);

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

  // Parse createdAt into milliseconds safely
  const getCreatedAtMs = (val: unknown): number => {
    if (!val) return Date.now();
    if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
      return (val as { toDate: () => Date }).toDate().getTime();
    }
    if (val instanceof Date) return val.getTime();
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "seconds" in val && typeof (val as { seconds: number }).seconds === "number") {
      return (val as { seconds: number }).seconds * 1000;
    }
    const parsed = new Date(val as string).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  };

  // 10-Minute cancellation countdown timer
  useEffect(() => {
    if (!booking?.createdAt) return;

    const createdMs = getCreatedAtMs(booking.createdAt);

    const updateTimer = () => {
      const elapsedSec = Math.floor((Date.now() - createdMs) / 1000);
      const left = Math.max(0, 600 - elapsedSec); // 10 mins = 600 seconds
      setRemainingSeconds(left);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking?.createdAt]);

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !user || actionLoading) return;
    if (!otpInput || otpInput.trim().length !== 4) {
      setOtpError("Please enter the complete 4-digit code provided by the customer.");
      return;
    }

    setActionLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    const res = await verifyBookingOtp(booking.id, otpInput.trim(), user.uid);
    if (res.error) {
      setOtpError(res.error);
    } else {
      setOtpSuccess("OTP verified! Service is now in progress.");
      setBooking((prev) => (prev ? { ...prev, status: "in-progress", updatedAt: new Date() } : prev));
    }
    setActionLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!booking || !user || actionLoading) return;

    const confirmMsg =
      remainingSeconds && remainingSeconds > 0
        ? "Cancel this booking now to receive a ₹5 refund directly into your KaamWala Wallet?"
        : "The 10-minute refund window has expired. Cancelling now will not include a platform fee refund. Proceed?";

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setError(null);

    const res = await cancelBookingWithRefund(booking.id, user.uid);
    if (res.error) {
      setError(res.error);
    } else {
      setRefundMessage(res.message);
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              cancellationRefund: res.refundAmount,
              refundStatus: res.refundAmount > 0 ? "credited_to_wallet" : "no_refund_after_10min",
              updatedAt: new Date(),
            }
          : prev
      );
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
            <Link href="/services">
              <Button variant="primary">Explore Services</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const isCustomer = user?.uid === booking.customerId;
  const isWorker = user?.uid === booking.workerId || (booking.workerId === "broadcast" && !isCustomer);
  const canCancel =
    isCustomer &&
    (booking.status === "pending" || booking.status === "accepted" || booking.status === "confirmed");

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

          {/* Refund Notification Alert */}
          <AnimatePresence>
            {(refundMessage || booking.refundStatus) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-6 rounded-2xl p-4 border flex items-start gap-3 ${
                  booking.refundStatus === "credited_to_wallet" || (booking.cancellationRefund && booking.cancellationRefund > 0)
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                }`}
              >
                <Wallet className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">
                    {booking.refundStatus === "credited_to_wallet" || (booking.cancellationRefund && booking.cancellationRefund > 0)
                      ? "₹5 Wallet Refund Processed!"
                      : "Booking Cancelled"}
                  </h4>
                  <p className="text-xs mt-0.5">
                    {refundMessage ||
                      (booking.refundStatus === "credited_to_wallet"
                        ? "₹5 has been credited to your KaamWala Wallet balance."
                        : "Cancellation occurred after the 10-minute refund window. No platform fee was refunded.")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Customer 4-Digit OTP Display Card */}
          {isCustomer && booking.startOtp && booking.status !== "completed" && booking.status !== "cancelled" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-sm mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs uppercase font-extrabold tracking-wider text-amber-700 dark:text-amber-300">
                      Start Job Code / ओटीपी
                    </span>
                    <Badge variant="warning">Share upon arrival</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-text">Customer Service OTP</h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md">
                    Share this 4-digit code with your worker only when they arrive at your location to begin work.
                  </p>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1.5 self-center sm:self-auto">
                  <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl px-6 py-3 shadow-md flex items-center gap-3">
                    <KeyRound className="w-5 h-5 text-amber-500" />
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-amber-600 dark:text-amber-400">
                      {booking.startOtp}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure handoff verification
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customer 10-Minute Cancellation Box */}
          {canCancel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    remainingSeconds !== null && remainingSeconds > 0
                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-700 text-text-muted"
                  }`}
                >
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text">10-Minute Cancellation Policy</h3>
                    {remainingSeconds !== null && remainingSeconds > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {formatCountdown(remainingSeconds)} left
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-text-muted">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {remainingSeconds !== null && remainingSeconds > 0
                      ? "Cancel within this countdown to receive a instant ₹5 refund to your KaamWala Wallet."
                      : "Cancellation after 10 minutes will not include a platform fee refund."}
                  </p>
                </div>
              </div>

              <Button
                variant={remainingSeconds !== null && remainingSeconds > 0 ? "danger" : "secondary"}
                size="sm"
                onClick={handleCancelBooking}
                isLoading={actionLoading}
                disabled={actionLoading}
                className="whitespace-nowrap"
              >
                {remainingSeconds !== null && remainingSeconds > 0
                  ? "Cancel & Get ₹5 Refund"
                  : "Cancel Booking"}
              </Button>
            </motion.div>
          )}

          {/* Main Booking Details Card */}
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
                  {booking.isBroadcast && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary font-semibold rounded-full">
                      5km Broadcast
                    </span>
                  )}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === "completed"
                    ? "success"
                    : booking.status === "in-progress"
                    ? "primary"
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
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Assigned Worker</p>
                  <p className="font-medium text-text">{booking.workerName || "Matching nearby workers..."}</p>
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
                    <p className="text-xs text-text-muted">Time Slot</p>
                    <p className="font-medium text-text">{booking.time}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-950 rounded-xl flex items-center justify-center text-secondary">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Platform Fee (Paid Online)</p>
                  <p className="font-medium text-text">
                    {formatCurrency(booking.platformFee ?? booking.amount ?? 10)}
                  </p>
                </div>
              </div>

              {booking.address && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Service Location</p>
                    <p className="font-medium text-text">{booking.address}</p>
                    {booking.landmark && (
                      <p className="text-xs text-text-muted">Landmark: {booking.landmark}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Worker Payment Notice */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-text-secondary">
                <strong className="text-text font-semibold">Post-Job Payment Disclaimer:</strong> Only the ₹10 platform booking fee was charged online. Please pay the worker directly in cash or UPI after the job is completed to your satisfaction.
              </div>
            </div>

            {booking.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-text mb-2">Description / Notes</h3>
                <p className="text-sm text-text-secondary bg-surface-alt rounded-xl p-4">
                  {booking.description}
                </p>
              </div>
            )}
          </motion.div>

          {/* WORKER ACTIONS */}
          {/* 1. Worker Pending Action: Accept / Decline */}
          {isWorker && booking.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-2">Incoming Booking Request</h3>
              <p className="text-xs text-text-secondary mb-4">
                Accept this job to confirm the booking and request the customer's 4-digit OTP upon arrival.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate("accepted")}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  Accept Booking (स्वीकारें)
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusUpdate("rejected")}
                  isLoading={actionLoading}
                  disabled={actionLoading}
                >
                  Decline (अस्वीकारें)
                </Button>
              </div>
            </motion.div>
          )}

          {/* 2. Worker Accepted/Confirmed: Enter Customer OTP to start service */}
          {isWorker && (booking.status === "accepted" || booking.status === "confirmed") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border-2 border-primary/30 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-text">Verify Customer OTP to Start Job</h3>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mb-5">
                Ask the customer for the 4-digit code displayed on their screen upon your arrival. Entering this OTP transitions the booking to "In Progress".
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Customer 4-Digit OTP (ओटीपी दर्ज करें)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="e.g. 4821"
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] font-extrabold py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {otpError && (
                  <div className="text-xs text-danger flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpSuccess && (
                  <div className="text-xs text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{otpSuccess}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={actionLoading}
                  disabled={actionLoading || otpInput.length !== 4}
                  className="w-full"
                >
                  Verify OTP & Start Job (शुरू करें)
                </Button>
              </form>
            </motion.div>
          )}

          {/* 3. Worker In-Progress: Mark Service Complete */}
          {isWorker && booking.status === "in-progress" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-text">Service In Progress</h3>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mb-4">
                Service has been started. Collect your labor payment directly in cash or UPI from the customer before marking the booking as completed.
              </p>
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate("completed")}
                isLoading={actionLoading}
                disabled={actionLoading}
              >
                Mark Complete (कार्य पूर्ण हुआ)
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
