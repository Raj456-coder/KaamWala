"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Star,
  User,
  Trash2,
  Heart,
  History,
  AlertCircle,
  RefreshCw,
  Briefcase,
  X,
  CreditCard,
  Crown,
  Phone,
} from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import BookingDialog from "@/components/booking/BookingDialog";
import ReviewDialog from "@/components/booking/ReviewDialog";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { getBookingsByCustomer } from "@/services/bookingService";
import { getPaymentsByCustomer } from "@/services/paymentService";
import { getSavedWorkers, removeSavedWorker } from "@/services/firestoreService";
import { getReviewsByBooking } from "@/services/bookingService";
import { createNotification } from "@/services/notificationService";
import { updateBookingStatus } from "@/services/bookingService";
import { getMembershipByUserId, getCustomerFreeContactCount } from "@/services/monetizationService";
import { MembershipWithId, ContactUnlockWithId } from "@/types/monetization";
import { BookingDoc, ReviewDoc } from "@/types/firestore";
import { FirestoreWorker } from "@/services/firestoreService";
import { TransactionWithId } from "@/types/monetization";
import { cn, formatCurrency } from "@/lib/utils";

function BookingCard({
  booking,
  actions,
}: {
  booking: BookingDoc;
  actions?: React.ReactNode;
}) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-text truncate">
              {booking.service}
            </h4>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
            {booking.workerName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {booking.workerName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(booking.date)}
            </span>
            {booking.time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {booking.time}
              </span>
            )}
            {booking.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {booking.address}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>

          {booking.description && (
            <p className="text-sm text-text-muted mt-2 line-clamp-2">
              {booking.description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}

function WorkerCard({
  worker,
  onRemove,
}: {
  worker: FirestoreWorker;
  onRemove: (workerId: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex-shrink-0 bg-cover bg-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600"
          style={
            worker.photoURL
              ? { backgroundImage: `url(${worker.photoURL})` }
              : undefined
          }
        >
          {!worker.photoURL && (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-lg font-bold">
              {worker.name.split(" ").map((n) => n[0]).join("")}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-text">{worker.name}</p>
          <p className="text-sm text-text-muted">
            {worker.professionalInfo?.category || worker.professionalInfo?.profession || ""}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            <span className="text-sm text-text-muted">
              {worker.rating?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(worker.id)}
        leftIcon={<Trash2 className="w-4 h-4" />}
      >
        Remove
      </Button>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [payments, setPayments] = useState<TransactionWithId[]>([]);
  const [savedWorkers, setSavedWorkers] = useState<FirestoreWorker[]>([]);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rebookDialogOpen, setRebookDialogOpen] = useState(false);
  const [rebookWorkerId, setRebookWorkerId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDoc | null>(null);
  const [membership, setMembership] = useState<{ planId: string; status: string } | null>(null);
  const [freeContactCount, setFreeContactCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && role === "worker") {
      router.push("/role-select");
    }
  }, [user, role, router]);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return;
      const { membership: mem } = await getMembershipByUserId(user.uid);
      if (mem) {
        setMembership({ planId: mem.planId, status: mem.status });
      }
      const { count } = await getCustomerFreeContactCount(user.uid);
      setFreeContactCount(count);
    };
    fetchMembership();
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const bookingsResult = await getBookingsByCustomer(user.uid);
      if (bookingsResult.error) {
        setError(bookingsResult.error);
      } else {
        setBookings(bookingsResult.bookings);
      }

      const paymentsResult = await getPaymentsByCustomer(user.uid);
      if (paymentsResult.error) {
        setError(paymentsResult.error);
      } else {
        setPayments(paymentsResult.payments);
      }

      const savedWorkersResult = await getSavedWorkers(user.uid);
      if (savedWorkersResult.error) {
        setError(savedWorkersResult.error);
      } else {
        setSavedWorkers(savedWorkersResult.workers);
      }

      const completedBookings = bookingsResult.bookings.filter(
        (b) => b.status === "completed"
      );
      const allReviews: ReviewDoc[] = [];
      for (const booking of completedBookings.slice(0, 10)) {
        const reviewsResult = await getReviewsByBooking(booking.id);
        if (!reviewsResult.error && reviewsResult.reviews.length > 0) {
          const customerReviews = reviewsResult.reviews.filter(
            (r) => r.customerId === user.uid
          );
          allReviews.push(...customerReviews);
        }
      }
      setReviews(allReviews);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && role !== "worker") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [user, role, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCancelBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError(null);
    try {
      const { error } = await updateBookingStatus(bookingId, "cancelled");
      if (error) {
        setError(error);
        setActionLoading(null);
        return;
      }

      const booking = bookings.find((b) => b.id === bookingId);
      if (booking?.workerId) {
        await createNotification(
          booking.workerId,
          "booking_cancelled",
          "Booking Cancelled",
          `Your booking for ${booking.service} has been cancelled by the customer.`,
          bookingId
        );
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" as const } : b))
      );
    } catch {
      setError("Failed to cancel booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveSavedWorker = async (workerId: string) => {
    if (!user) return;
    setActionLoading(workerId);
    setError(null);
    try {
      const { error } = await removeSavedWorker(user.uid, workerId);
      if (error) {
        setError(error);
        setActionLoading(null);
        return;
      }
      setSavedWorkers((prev) => prev.filter((w) => w.id !== workerId));
    } catch {
      setError("Failed to remove saved worker.");
    } finally {
      setActionLoading(null);
    }
  };

  const openReviewDialog = (bookingId: string) => {
    setReviewBookingId(bookingId);
    setReviewDialogOpen(true);
  };

  const closeReviewDialog = () => {
    setReviewDialogOpen(false);
    setReviewBookingId(null);
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "accepted"
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const bookingHistory = [...completedBookings, ...cancelledBookings].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user || role === "worker") return null;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold font-heading text-text">
                Customer Dashboard
              </h1>
              <p className="text-text-secondary mt-1">
                Manage your bookings, favorites, and reviews
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/20 text-danger rounded-2xl p-4 text-sm flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Membership Status */}
          {membership && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-50 dark:bg-warning-950 rounded-xl flex items-center justify-center text-warning">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">Membership</p>
                    <p className="text-sm text-text-secondary capitalize">{membership.planId} · {membership.status}</p>
                  </div>
                </div>
                <Link href="/membership">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Free Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-xl flex items-center justify-center text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-text">Free Contact Unlocks</p>
                  <p className="text-sm text-text-secondary">
                    {3 - freeContactCount} / 3 remaining
                  </p>
                </div>
              </div>
              {freeContactCount >= 3 && (
                <p className="text-sm text-text-muted">Exhausted</p>
              )}
            </div>
            {freeContactCount >= 3 && (
              <div className="mt-4 p-3 rounded-xl bg-warning-50 dark:bg-warning-950 border border-warning/20">
                <p className="text-sm text-warning font-medium">
                  Additional unlocks cost {formatCurrency(10)} each.
                </p>
              </div>
            )}
          </motion.div>

          {/* Upcoming Bookings */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Upcoming Bookings
                {upcomingBookings.length > 0 && (
                  <Badge variant="warning">{upcomingBookings.length}</Badge>
                )}
              </h2>
            </div>
            {upcomingBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No upcoming bookings.</p>
                <Link href="/search" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Find Workers
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actions={
                      booking.status === "pending" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          isLoading={actionLoading === booking.id}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Cancel
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* Completed Jobs */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Completed Jobs
                {completedBookings.length > 0 && (
                  <Badge variant="success">{completedBookings.length}</Badge>
                )}
              </h2>
            </div>
            {completedBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No completed jobs yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actions={
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRebookWorkerId(booking.workerId);
                            setRebookDialogOpen(true);
                          }}
                          leftIcon={<RefreshCw className="w-4 h-4" />}
                        >
                          Rebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setDetailsOpen(true);
                          }}
                          leftIcon={<MapPin className="w-4 h-4" />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(booking.id)}
                          leftIcon={<Star className="w-4 h-4" />}
                        >
                          Review
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* Saved Workers */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <Heart className="w-5 h-5 text-danger" />
                Saved Workers
                {savedWorkers.length > 0 && (
                  <Badge variant="danger">{savedWorkers.length}</Badge>
                )}
              </h2>
            </div>
            {savedWorkers.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No saved workers yet.</p>
                <Link href="/search" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Browse Workers
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedWorkers.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    onRemove={handleRemoveSavedWorker}
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* Booking History */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Booking History
              </h2>
            </div>
            {bookingHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No booking history yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingHistory.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </motion.section>

          {/* Payment History */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment History
              </h2>
            </div>
            {payments.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No payment records yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 mb-2">
                           <h4 className="font-semibold text-text truncate">
                             {payment.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                           </h4>
                           <Badge
                             variant={
                               payment.status === "success"
                                 ? "success"
                                 : payment.status === "failed"
                                 ? "danger"
                                 : "warning"
                             }
                           >
                             {payment.status}
                           </Badge>
                         </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                          <span className="flex items-center gap-1.5 font-medium text-text">
                            {formatCurrency(payment.amount)}
                          </span>
                          {payment.paymentId && (
                            <span className="text-xs font-mono text-text-muted">
                              {payment.paymentId.slice(0, 20)}...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                          {payment.createdAt
                            ? payment.createdAt.toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Reviews */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                My Reviews
                {reviews.length > 0 && (
                  <Badge variant="warning">{reviews.length}</Badge>
                )}
              </h2>
            </div>
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No reviews yet.</p>
                {completedBookings.length > 0 && (
                  <p className="text-sm text-text-muted mt-2">
                    Complete a job and submit a review to see it here.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4",
                            i < review.rating
                              ? "text-warning fill-warning"
                              : "text-slate-300 dark:text-slate-600"
                          )}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-text-secondary text-sm">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {review.createdAt
                        ? review.createdAt.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
      <Footer />

      <ReviewDialog
        isOpen={reviewDialogOpen}
        onClose={closeReviewDialog}
        bookingId={reviewBookingId || ""}
      />

      <BookingDialog
        isOpen={rebookDialogOpen}
        onClose={() => setRebookDialogOpen(false)}
        workerId={rebookWorkerId || ""}
        workerName=""
        workerImage=""
      />

      <AnimatePresence>
        {detailsOpen && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetailsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 border border-slate-200 dark:border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading text-text">Booking Details</h2>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="p-2 text-text-muted hover:text-text rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-text-muted">Service</span>
                  <p className="font-semibold text-text">{selectedBooking.service}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-text-muted">Date</span>
                    <p className="font-semibold text-text">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-text-muted">Time</span>
                    <p className="font-semibold text-text">{selectedBooking.time || "N/A"}</p>
                  </div>
                </div>
                {selectedBooking.duration && (
                  <div>
                    <span className="text-sm text-text-muted">Estimated Duration</span>
                    <p className="font-semibold text-text">{selectedBooking.duration}</p>
                  </div>
                )}
                {selectedBooking.address && (
                  <div>
                    <span className="text-sm text-text-muted">Address</span>
                    <p className="font-semibold text-text">{selectedBooking.address}</p>
                  </div>
                )}
                {selectedBooking.landmark && (
                  <div>
                    <span className="text-sm text-text-muted">Landmark</span>
                    <p className="font-semibold text-text">{selectedBooking.landmark}</p>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div>
                    <span className="text-sm text-text-muted">Notes</span>
                    <p className="font-semibold text-text">{selectedBooking.notes}</p>
                  </div>
                )}
                {selectedBooking.description && (
                  <div>
                    <span className="text-sm text-text-muted">Description</span>
                    <p className="font-semibold text-text">{selectedBooking.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-text-muted">Status</span>
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>
                <div>
                  <span className="text-sm text-text-muted">Total Amount</span>
                  <p className="font-semibold text-text">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}