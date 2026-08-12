"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  DollarSign,
  User,
  Bell,
  TrendingUp,
  Star,
  RefreshCw,
  Zap,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getBookingsByWorker, updateBookingStatus } from "@/services/bookingService";
import { getWorkerById, updateWorkerAvailability } from "@/services/firestoreService";
import { getSubscriptionByUserId, hasActiveWorkerSubscription, getTrialDaysRemaining } from "@/services/monetizationService";
import { SubscriptionWithId } from "@/types/monetization";
import { createNotification } from "@/services/notificationService";
import { BookingDoc, WorkerDoc, NotificationType } from "@/types/firestore";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

function BookingCard({
  booking,
  actions,
  showEarnings = false,
}: {
  booking: BookingDoc;
  actions?: React.ReactNode;
  showEarnings?: boolean;
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
            <h4 className="font-semibold text-text truncate">{booking.service}</h4>
            <BookingStatusBadge status={booking.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
            {booking.customerName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {booking.customerName}
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
            {showEarnings && booking.earnings !== undefined && (
              <span className="flex items-center gap-1.5 text-success font-medium">
                <DollarSign className="w-3.5 h-3.5" />
                {formatCurrency(booking.earnings)}
              </span>
            )}
          </div>

          {booking.description && (
            <p className="text-sm text-text-muted mt-2 line-clamp-2">{booking.description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [worker, setWorker] = useState<WorkerDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionWithId | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && role === "customer") {
      router.push("/role-select");
    }
  }, [user, role, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [bookingsResult, workerResult, subscriptionResult] = await Promise.all([
        getBookingsByWorker(user.uid),
        getWorkerById(user.uid),
        getSubscriptionByUserId(user.uid),
      ]);

      if (bookingsResult.error) {
        setError(bookingsResult.error);
      } else {
        setBookings(bookingsResult.bookings);
      }

      if (workerResult.error) {
        setWorker(null);
      } else if (workerResult.worker) {
        setWorker(workerResult.worker);
      }

      if (subscriptionResult.subscription) {
        setSubscription(subscriptionResult.subscription);
      }
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && role !== "customer") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [user, role, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const acceptedBookings = bookings.filter((b) => b.status === "accepted");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const inProgressBookings = bookings.filter((b) => b.status === "in-progress");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + (b.earnings || b.totalAmount || 0),
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEarnings = completedBookings
    .filter((b) => {
      const bookingDate = b.updatedAt || b.createdAt;
      return (
        bookingDate.getMonth() === currentMonth &&
        bookingDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, b) => sum + (b.earnings || b.totalAmount || 0), 0);

  const pendingPayments = acceptedBookings.reduce(
    (sum, b) => sum + (b.earnings || b.totalAmount || 0),
    0
  ) + inProgressBookings.reduce(
    (sum, b) => sum + (b.earnings || b.totalAmount || 0),
    0
  ) + confirmedBookings.reduce(
    (sum, b) => sum + (b.earnings || b.totalAmount || 0),
    0
  );

  const bookingStats = {
    total: bookings.length,
    pending: pendingBookings.length,
    accepted: acceptedBookings.length,
    completed: completedBookings.length,
    cancelled: cancelledBookings.length,
  };

  const profileFields = worker
    ? [
        !!worker.personalInfo?.fullName,
        !!worker.personalInfo?.phone,
        !!worker.personalInfo?.address,
        !!worker.professionalInfo?.profession,
        !!worker.professionalInfo?.description,
        worker.professionalInfo?.skills && worker.professionalInfo.skills.length > 0,
        worker.professionalInfo?.languages && worker.professionalInfo.languages.length > 0,
        !!worker.serviceArea?.city,
        !!worker.serviceArea?.state,
        !!worker.serviceArea?.pincode,
        !!worker.documents?.profilePhoto,
        !!worker.documents?.aadhaar,
      ]
    : [];

  const filledFields = profileFields.filter(Boolean).length;
  const profileCompletion = profileFields.length > 0 ? Math.round((filledFields / profileFields.length) * 100) : 0;

  const handleStatusUpdate = async (
    bookingId: string,
    status: BookingDoc["status"],
    customerId: string
  ) => {
    setActionLoading(bookingId);
    setError(null);
    try {
      const { error } = await updateBookingStatus(bookingId, status);
      if (error) {
        setError(error);
        setActionLoading(null);
        return;
      }

      const titles: Record<string, string> = {
        accepted: "Booking accepted",
        rejected: "Booking declined",
        completed: "Job completed",
      };
      const messages: Record<string, string> = {
        accepted: "Your booking has been accepted by the worker.",
        rejected: "Your booking request has been declined.",
        completed: "Your job has been marked as completed.",
      };
      const notificationTypes: Record<string, string> = {
        accepted: "booking_accepted",
        rejected: "booking_rejected",
        completed: "booking_completed",
      };

      await createNotification(
        customerId,
        (notificationTypes[status] as NotificationType) || "system",
        titles[status] || "Booking Updated",
        messages[status] || "Your booking status has been updated.",
        bookingId
      );

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch {
      setError("Failed to update booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!worker) return;
    const newStatus = !worker.isAvailable;
    setError(null);
    try {
      const { error } = await updateWorkerAvailability(worker.uid, newStatus);
      if (error) {
        setError(error);
        return;
      }
      setWorker((prev) => (prev ? { ...prev, isAvailable: newStatus } : prev));
    } catch {
      setError("Failed to update availability.");
    }
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
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

  if (!user || role === "customer") return null;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-text">Worker Dashboard</h1>
              <p className="text-text-secondary mt-1">Manage your jobs, earnings, and profile</p>
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
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Total Bookings</p>
              <p className="text-3xl font-bold text-text mt-1">{bookings.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Pending</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold text-warning">{pendingBookings.length}</p>
                {pendingBookings.length > 0 && (
                  <Badge variant="warning" size="sm">Action needed</Badge>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Completed</p>
              <p className="text-3xl font-bold text-success mt-1">{completedBookings.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Total Earnings</p>
              <p className="text-3xl font-bold text-success mt-1">
                {formatCurrency(totalEarnings)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Monthly Earnings</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {formatCurrency(monthlyEarnings)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <p className="text-sm text-text-muted font-medium">Pending Payments</p>
              <p className="text-3xl font-bold text-warning mt-1">
                {formatCurrency(pendingPayments)}
              </p>
            </motion.div>
          </div>

          {/* Booking Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Booking Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-text">{bookingStats.total}</p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{bookingStats.pending}</p>
                <p className="text-xs text-text-muted">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">{bookingStats.accepted}</p>
                <p className="text-xs text-text-muted">Accepted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{bookingStats.completed}</p>
                <p className="text-xs text-text-muted">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-danger">{bookingStats.cancelled}</p>
                <p className="text-xs text-text-muted">Cancelled</p>
              </div>
            </div>
          </motion.div>

          {/* Availability Toggle + Profile Completion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Availability
              </h3>
              {worker ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary">
                      You are currently{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          worker.isAvailable ? "text-success" : "text-text-muted"
                        )}
                      >
                        {worker.isAvailable ? "Available for work" : "Unavailable"}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant={worker.isAvailable ? "outline" : "primary"}
                    onClick={handleToggleAvailability}
                  >
                    {worker.isAvailable ? "Go Offline" : "Go Online"}
                  </Button>
                </div>
              ) : (
                <p className="text-text-muted">Complete your profile to set availability.</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Profile Completion
              </h3>
              {profileCompletion < 100 ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                    <p className="text-sm text-text-muted mt-2">{profileCompletion}% complete</p>
                  </div>
                  <Link href="/become-worker">
                    <Button variant="outline" size="sm">Complete Profile</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Profile Complete!</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Subscription Plan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Subscription
              </h3>
              <Link href="/subscriptions">
                <Button variant="outline" size="sm">Manage Plan</Button>
              </Link>
            </div>
            {subscription ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {hasActiveWorkerSubscription(subscription) ? (
                    <>
                      <p className="text-2xl font-bold text-text capitalize">
                        {subscription.planId === "free" ? "Free Listing" : subscription.planId}
                      </p>
                      {subscription.status === "trial" && subscription.freeTrialEndDate && (
                        <p className="text-sm text-text-secondary">
                          Free Listing — {getTrialDaysRemaining(subscription)} days remaining
                        </p>
                      )}
                      {subscription.status === "active" && subscription.endDate && (
                        <p className="text-sm text-text-secondary">
                          Active until {new Date(subscription.endDate).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-danger">Subscription Required</p>
                      <p className="text-sm text-text-secondary">Your free listing period has ended.</p>
                    </>
                  )}
                </div>
                <div>
                  {hasActiveWorkerSubscription(subscription) ? (
                    <Badge variant={subscription.status === "trial" ? "warning" : "success"}>
                      {subscription.status === "trial" ? "Free Trial" : "Active"}
                    </Badge>
                  ) : (
                    <Link href="/subscriptions">
                      <Button variant="primary" size="sm">Choose a Plan</Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-text-secondary mb-3">No subscription found.</p>
                <Link href="/subscriptions">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Verification Status */}
          {worker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Verification Status
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                      worker.verificationStatus === "verified" ? "success" :
                      worker.verificationStatus === "pending" ? "warning" :
                      worker.verificationStatus === "suspended" ? "danger" :
                      worker.verificationStatus === "rejected" ? "danger" : "neutral"
                    }>
                      {worker.verificationStatus.replace("_", " ")}
                    </Badge>
                    {worker.isVerified && (
                      <span className="text-sm text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">
                    {worker.verificationStatus === "pending" && "Your profile is pending verification. We'll review your documents soon."}
                    {worker.verificationStatus === "under_review" && "Your profile is currently under review."}
                    {worker.verificationStatus === "verified" && "Your profile has been verified. You can now receive bookings."}
                    {worker.verificationStatus === "rejected" && "Your verification was rejected. Please update your documents and try again."}
                    {worker.verificationStatus === "suspended" && "Your account has been suspended. Contact support for more information."}
                  </p>
                </div>
                {(worker.verificationStatus === "rejected" || worker.verificationStatus === "pending") && (
                  <Link href="/become-worker">
                    <Button variant="outline" size="sm">Update Documents</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/20 text-danger rounded-2xl p-4 text-sm flex items-center justify-between"
            >
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Incoming Bookings */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                Incoming Bookings
                {pendingBookings.length > 0 && (
                  <Badge variant="warning">{pendingBookings.length}</Badge>
                )}
              </h2>
            </div>
            {pendingBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted">No pending bookings right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actions={
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusUpdate(booking.id, "accepted", booking.customerId)
                          }
                          isLoading={actionLoading === booking.id}
                          leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            handleStatusUpdate(booking.id, "rejected", booking.customerId)
                          }
                          isLoading={actionLoading === booking.id}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Reject
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </motion.section>

          {/* Accepted Jobs */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text">Accepted Jobs</h2>
            </div>
              {acceptedBookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted mb-4">No accepted jobs yet.</p>
                  <p className="text-sm text-text-secondary">Enable your availability to receive more bookings.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {acceptedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    actions={
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusUpdate(booking.id, "completed", booking.customerId)
                        }
                        isLoading={actionLoading === booking.id}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Mark Complete
                      </Button>
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
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text">Completed Jobs</h2>
            </div>
            {completedBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <p className="text-text-muted mb-4">No completed jobs yet.</p>
                <p className="text-sm text-text-secondary mb-4">Complete your first booking to start earning and see your stats here.</p>
                <Link href="/search">
                  <Button variant="outline" size="sm">
                    Find Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showEarnings
                    actions={
                      <Link href={`/workers/${booking.workerId}#reviews`}>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Star className="w-4 h-4" />}
                        >
                          View Reviews
                        </Button>
                      </Link>
                    }
                  />
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
