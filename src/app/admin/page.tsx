"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  Calendar,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Zap,
  Crown,
  Unlock,
  Store,
  ShieldCheck,
  Users,
  BookOpen,
  FileText,
  X,
  CheckCircle2,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

function KPICard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-surface-alt rounded-lg flex items-center justify-center text-text-secondary">
          {icon}
        </div>
        <p className="text-sm text-text-muted font-medium">{title}</p>
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
    </div>
  );
}

import { getAdminStats, getRecentUsers, getAllWorkers, getAllBookings } from "@/services/firestoreService";
import { updateBookingStatus } from "@/services/bookingService";
import {
  getAllTransactions,
  getAllSubscriptions,
  getAllMemberships,
  getAllContactUnlocks,
  listAdvertisers,
  updateSubscriptionStatus,
  updateMembershipStatus,
  updateContactUnlockStatus,
} from "@/services/monetizationService";
import Badge from "@/components/ui/Badge";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { FirestoreUser } from "@/types/firestore";
import { WorkerWithId } from "@/services/firestoreService";
import {
  TransactionWithId,
  SubscriptionWithId,
  MembershipWithId,
  ContactUnlockWithId,
  AdvertiserWithId,
  SupportRequestWithId,
  SupportRequestStatus,
  SubscriptionStatus,
  MembershipStatus,
  ContactUnlockStatus,
} from "@/types/monetization";
import { WorkerVerificationDoc, AuditLogDoc, BookingDoc } from "@/types/firestore";
import { cn, formatCurrency } from "@/lib/utils";
import TransactionTable from "@/components/monetization/TransactionTable";
import {
  getVerificationQueue,
  createOrUpdateVerification,
  suspendWorker,
  reactivateWorker,
  getAuditLogs,
  createAuditLog,
} from "@/services/verificationService";
import { getAllSupportRequests, updateSupportRequestStatus } from "@/services/supportService";

type AdminTab = "overview" | "workers" | "verifications" | "bookings" | "users" | "transactions" | "subscriptions" | "memberships" | "unlocks" | "advertisers" | "support" | "audit";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalWorkers: number;
    verifiedWorkers: number;
    pendingVerifications: number;
    activeBookings: number;
    completedBookings: number;
    totalTransactions: number;
    activeAdvertisements: number;
  } | null>(null);
  const [recentUsers, setRecentUsers] = useState<FirestoreUser[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithId[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithId[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithId[]>([]);
  const [unlocks, setUnlocks] = useState<ContactUnlockWithId[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserWithId[]>([]);
  const [verifications, setVerifications] = useState<WorkerVerificationDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<BookingDoc["status"] | "all">("all");
  const [supportRequests, setSupportRequests] = useState<SupportRequestWithId[]>([]);
  const [supportStatusFilter, setSupportStatusFilter] = useState<SupportRequestStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [reviewingVerification, setReviewingVerification] = useState<WorkerVerificationDoc | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "under_review" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [advertiserAction, setAdvertiserAction] = useState<AdvertiserWithId | null>(null);
  const [advertiserActionType, setAdvertiserActionType] = useState<"approve" | "reject" | "pause" | "reactivate" | null>(null);
  const [advertiserRejectionReason, setAdvertiserRejectionReason] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (role !== "admin") {
      // Permission check requires immediate error state update
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Access denied. Admin privileges required.");
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { stats: fetchedStats, error: statsError } = await getAdminStats();
      if (!statsError && fetchedStats) {
        setStats(fetchedStats);
      }

      const { users: fetchedUsers, error: usersError } = await getRecentUsers(10);
      if (!usersError && fetchedUsers) {
        setRecentUsers(fetchedUsers);
      }

      const { workers: fetchedWorkers } = await getAllWorkers(100);
      if (fetchedWorkers) {
        setAllWorkers(fetchedWorkers);
      }

      const { bookings: fetchedBookings } = await getAllBookings(100);
      if (fetchedBookings) {
        setBookings(fetchedBookings);
      }

      const [transactionsResult, subscriptionsResult, membershipsResult, unlocksResult, advertisersResult, verificationsResult, auditResult, supportResult] = await Promise.all([
        getAllTransactions(),
        getAllSubscriptions(),
        getAllMemberships(),
        getAllContactUnlocks(),
        listAdvertisers(),
        getVerificationQueue(),
        getAuditLogs(50),
        getAllSupportRequests(),
      ]);

      if (transactionsResult.transactions) setTransactions(transactionsResult.transactions);
      if (subscriptionsResult.subscriptions) setSubscriptions(subscriptionsResult.subscriptions);
      if (membershipsResult.memberships) setMemberships(membershipsResult.memberships);
      if (unlocksResult.unlocks) setUnlocks(unlocksResult.unlocks);
      if (advertisersResult.advertisers) setAdvertisers(advertisersResult.advertisers);
      if (verificationsResult.verifications) setVerifications(verificationsResult.verifications);
      if (auditResult.logs) setAuditLogs(auditResult.logs);
      if (supportResult.requests) setSupportRequests(supportResult.requests);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVerificationAction = async () => {
    if (!reviewingVerification || !reviewAction || !user) return;
    setActionLoading(true);
    setActionError(null);

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      setActionError("Rejection reason is required.");
      setActionLoading(false);
      return;
    }

    const result = await createOrUpdateVerification(
      reviewingVerification.workerId,
      reviewAction === "under_review" ? "under_review" : reviewAction === "approve" ? "verified" : "rejected",
      {
        reviewedBy: user.uid,
        rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
        adminNotes: adminNotes || undefined,
      }
    );

    if (result.error) {
      setActionError(result.error);
    } else {
      setVerifications((prev) => prev.filter((v) => v.id !== reviewingVerification.id));
      setReviewingVerification(null);
      setReviewAction(null);
      setRejectionReason("");
      setAdminNotes("");
    }
    setActionLoading(false);
  };

  const handleSuspendWorker = async (workerId: string, reason: string) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const result = await suspendWorker(workerId, user.uid, reason);
    if (result.error) {
      setActionError(result.error);
    } else {
      setAllWorkers((prev) => prev.map((w) => w.id === workerId ? { ...w, verificationStatus: "suspended", isAvailable: false, isVerified: false } : w));
    }
    setActionLoading(false);
  };

  const handleReactivateWorker = async (workerId: string) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const result = await reactivateWorker(workerId, user.uid);
    if (result.error) {
      setActionError(result.error);
    } else {
      setAllWorkers((prev) => prev.map((w) => w.id === workerId ? { ...w, verificationStatus: "pending", isAvailable: true, isVerified: false, suspension: undefined } : w));
    }
    setActionLoading(false);
  };

  const handleAdvertiserAction = async () => {
    if (!advertiserAction || !advertiserActionType || !user) return;
    setActionLoading(true);
    setActionError(null);

    if (advertiserActionType === "reject" && !advertiserRejectionReason.trim()) {
      setActionError("Rejection reason is required.");
      setActionLoading(false);
      return;
    }

    const statusMap: Record<string, AdvertiserWithId["status"]> = {
      approve: "active",
      reject: "rejected",
      pause: "paused",
      reactivate: "active",
    };

    const { updateAdvertiserStatus } = await import("@/services/monetizationService");
    const result = await updateAdvertiserStatus(advertiserAction.id, statusMap[advertiserActionType]);

    if (result.error) {
      setActionError(result.error);
    } else {
      setAdvertisers((prev) => prev.map((a) => a.id === advertiserAction.id ? { ...a, status: statusMap[advertiserActionType] } : a));
      setAdvertiserAction(null);
      setAdvertiserActionType(null);
      setAdvertiserRejectionReason("");
    }
    setActionLoading(false);
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: BookingDoc["status"]) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const res = await updateBookingStatus(bookingId, newStatus);
    if (res.error) {
      setActionError(res.error);
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      void createAuditLog(
        user.uid,
        `booking_status_${newStatus}`,
        "booking",
        bookingId,
        `Status updated to ${newStatus} by admin`
      );
    }
    setActionLoading(false);
  };

  const handleSubscriptionStatusChange = async (subId: string, newStatus: SubscriptionStatus) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const res = await updateSubscriptionStatus(subId, newStatus);
    if (res.error) {
      setActionError(res.error);
    } else {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: newStatus } : s))
      );
      void createAuditLog(
        user.uid,
        `subscription_status_${newStatus}`,
        "subscription",
        subId,
        `Subscription status updated to ${newStatus} by admin`
      );
    }
    setActionLoading(false);
  };

  const handleMembershipStatusChange = async (memId: string, newStatus: MembershipStatus) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const res = await updateMembershipStatus(memId, newStatus);
    if (res.error) {
      setActionError(res.error);
    } else {
      setMemberships((prev) =>
        prev.map((m) => (m.id === memId ? { ...m, status: newStatus } : m))
      );
      void createAuditLog(
        user.uid,
        `membership_status_${newStatus}`,
        "membership",
        memId,
        `Membership status updated to ${newStatus} by admin`
      );
    }
    setActionLoading(false);
  };

  const handleContactUnlockStatusChange = async (unlockId: string, newStatus: ContactUnlockStatus) => {
    if (!user) return;
    setActionLoading(true);
    setActionError(null);
    const res = await updateContactUnlockStatus(unlockId, newStatus);
    if (res.error) {
      setActionError(res.error);
    } else {
      setUnlocks((prev) =>
        prev.map((u) => (u.id === unlockId ? { ...u, status: newStatus } : u))
      );
      void createAuditLog(
        user.uid,
        `contact_unlock_${newStatus}`,
        "contact_unlock",
        unlockId,
        `Contact unlock status updated to ${newStatus} by admin`
      );
    }
    setActionLoading(false);
  };

  if (authLoading || !user || role !== "admin") {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {error ? (
              <div className="bg-danger-50 dark:bg-danger-950 text-danger-700 dark:text-danger-200 p-6 rounded-2xl border border-danger-200 dark:border-danger-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary">Checking permissions...</p>
            )}
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (loading && !stats) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">Admin Dashboard</h1>
              <p className="text-text-secondary">Platform management and moderation</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "workers", label: "Workers", icon: Users },
              { id: "verifications", label: "Verifications", icon: ShieldCheck },
              { id: "bookings", label: "Bookings", icon: BookOpen },
              { id: "users", label: "Users", icon: User },
              { id: "transactions", label: "Transactions", icon: DollarSign },
              { id: "subscriptions", label: "Subscriptions", icon: Zap },
              { id: "memberships", label: "Memberships", icon: Crown },
              { id: "unlocks", label: "Unlocks", icon: Unlock },
              { id: "advertisers", label: "Advertisers", icon: Store },
              { id: "support", label: "Support", icon: Headphones },
              { id: "audit", label: "Audit Logs", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white dark:bg-slate-800 text-text-secondary hover:text-text border border-slate-200 dark:border-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {actionError && (
            <div className="mb-6 bg-danger-50 dark:bg-danger-950 text-danger-700 dark:text-danger-200 p-4 rounded-2xl border border-danger-200 dark:border-danger-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{actionError}</p>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Users" value={stats?.totalUsers || 0} icon={<User className="w-5 h-5 text-primary" />} />
                <KPICard title="Total Workers" value={stats?.totalWorkers || 0} icon={<Briefcase className="w-5 h-5 text-secondary" />} />
                <KPICard title="Verified Workers" value={stats?.verifiedWorkers || 0} icon={<ShieldCheck className="w-5 h-5 text-success" />} />
                <KPICard title="Pending Verifications" value={stats?.pendingVerifications || 0} icon={<AlertCircle className="w-5 h-5 text-warning" />} />
                <KPICard title="Active Bookings" value={stats?.activeBookings || 0} icon={<Calendar className="w-5 h-5 text-primary" />} />
                <KPICard title="Completed Bookings" value={stats?.completedBookings || 0} icon={<CheckCircle2 className="w-5 h-5 text-success" />} />
                <KPICard title="Total Transactions" value={stats?.totalTransactions || 0} icon={<DollarSign className="w-5 h-5 text-warning" />} />
                <KPICard title="Active Ads" value={stats?.activeAdvertisements || 0} icon={<Store className="w-5 h-5 text-secondary" />} />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold font-heading text-text mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Registrations
                </h2>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : recentUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">User</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((userItem) => (
                          <tr key={userItem.uid} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                                  {userItem.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                                </div>
                                <span className="font-medium text-text">{userItem.name || userItem.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{userItem.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant={userItem.role === "admin" ? "primary" : userItem.role === "worker" ? "warning" : "neutral"}>
                                {userItem.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-8">No recent registrations.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "verifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text">Verification Queue</h2>
                <Badge variant={verifications.length > 0 ? "warning" : "success"}>
                  {verifications.length} pending
                </Badge>
              </div>
              {verifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <ShieldCheck className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">No pending verifications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {verifications.map((verification) => {
                    const worker = allWorkers.find((w) => w.id === verification.workerId);
                    return (
                      <motion.div
                        key={verification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-text">{worker?.name || "Unknown Worker"}</p>
                            <p className="text-sm text-text-secondary">{worker?.professionalInfo?.profession || "N/A"}</p>
                          </div>
                          <Badge variant={verification.status === "pending" ? "warning" : "primary"}>
                            {verification.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-text-secondary mb-4">
                          <p>Location: {worker?.serviceArea?.city || "N/A"}, {worker?.serviceArea?.state || ""}</p>
                          <p>Submitted: {new Date(verification.submittedAt).toLocaleDateString()}</p>
                          <p>Documents: {verification.documentReferences.length} uploaded</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { setReviewingVerification(verification); setReviewAction("approve"); }}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => { setReviewingVerification(verification); setReviewAction("reject"); }}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "workers" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text">Worker Management</h2>
              {allWorkers.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted">No workers found.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Worker</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Profession</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Location</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allWorkers.map((worker) => (
                          <tr key={worker.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                                  {worker.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                                </div>
                                <span className="font-medium text-text">{worker.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{worker.professionalInfo?.profession || "N/A"}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{worker.serviceArea?.city || "N/A"}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  worker.verificationStatus === "verified" ? "success" :
                                  worker.verificationStatus === "pending" ? "warning" :
                                  worker.verificationStatus === "suspended" ? "danger" :
                                  worker.verificationStatus === "rejected" ? "danger" : "neutral"
                                }
                              >
                                {worker.verificationStatus.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {worker.verificationStatus !== "suspended" ? (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                      const reason = prompt("Suspension reason:");
                                      if (reason) handleSuspendWorker(worker.id, reason);
                                    }}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleReactivateWorker(worker.id)}
                                  >
                                    Reactivate
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-text">Booking Management</h2>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value as BookingDoc["status"] | "all")}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted">No bookings found.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Worker</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Service</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Created</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings
                          .filter((b) => bookingStatusFilter === "all" || b.status === bookingStatusFilter)
                          .map((booking) => (
                            <tr key={booking.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                              <td className="py-3 px-4 text-sm text-text">{booking.customerName || booking.customerId}</td>
                              <td className="py-3 px-4 text-sm text-text">{booking.workerName}</td>
                              <td className="py-3 px-4 text-sm text-text-secondary">{booking.service}</td>
                              <td className="py-3 px-4 text-sm text-text-secondary">{booking.date}</td>
                              <td className="py-3 px-4">
                                <Badge variant={
                                  booking.status === "completed" ? "success" :
                                  booking.status === "pending" ? "warning" :
                                  booking.status === "accepted" ? "primary" :
                                  booking.status === "rejected" || booking.status === "cancelled" ? "danger" : "neutral"
                                }>
                                  {booking.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-text-secondary">
                                {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={booking.status}
                                  disabled={actionLoading}
                                  onChange={(e) => handleBookingStatusChange(booking.id, e.target.value as BookingDoc["status"])}
                                  className="px-3 py-1.5 bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text">User Management</h2>
              {recentUsers.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted">No users found.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">User</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((userItem) => (
                          <tr key={userItem.uid} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">
                                  {userItem.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                                </div>
                                <span className="font-medium text-text">{userItem.name || userItem.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{userItem.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant={userItem.role === "admin" ? "primary" : userItem.role === "worker" ? "warning" : "neutral"}>
                                {userItem.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "transactions" && (
            <TransactionTable transactions={transactions} loading={loading} />
          )}

          {activeTab === "subscriptions" && (
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No subscriptions yet.</p>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-text">User: {sub.userId}</p>
                      <p className="text-sm text-text-secondary capitalize">{sub.planId} · {sub.price ? formatCurrency(sub.price) : "Free"} · {sub.status}</p>
                      {sub.endDate && (
                        <p className="text-xs text-text-muted">
                          Expires: {new Date(sub.endDate).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.status === "active" ? "success" : sub.status === "pending" ? "warning" : "neutral"}>
                        {sub.status}
                      </Badge>
                      {sub.status !== "active" && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleSubscriptionStatusChange(sub.id, "active")}
                        >
                          Activate
                        </Button>
                      )}
                      {sub.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleSubscriptionStatusChange(sub.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "memberships" && (
            <div className="space-y-3">
              {memberships.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No memberships yet.</p>
              ) : (
                memberships.map((mem) => (
                  <div key={mem.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-text">User: {mem.userId}</p>
                      <p className="text-sm text-text-secondary capitalize">{mem.planId} · {mem.status}</p>
                      {mem.endDate && (
                        <p className="text-xs text-text-muted">
                          Expires: {new Date(mem.endDate).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={mem.status === "active" ? "success" : mem.status === "pending" ? "warning" : "neutral"}>
                        {mem.status}
                      </Badge>
                      {mem.status !== "active" && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleMembershipStatusChange(mem.id, "active")}
                        >
                          Activate
                        </Button>
                      )}
                      {mem.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleMembershipStatusChange(mem.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "unlocks" && (
            <div className="space-y-3">
              {unlocks.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No contact unlocks yet.</p>
              ) : (
                unlocks.map((unlock) => (
                  <div key={unlock.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-text">Customer: {unlock.customerId} → Worker: {unlock.workerId}</p>
                      <p className="text-sm text-text-secondary">
                        {formatCurrency(unlock.amount)} · {unlock.status} {unlock.workerPhone ? `· Phone: ${unlock.workerPhone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={unlock.status === "success" ? "success" : unlock.status === "pending" ? "warning" : "neutral"}>
                        {unlock.status}
                      </Badge>
                      {unlock.status !== "success" && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleContactUnlockStatusChange(unlock.id, "success")}
                        >
                          Approve
                        </Button>
                      )}
                      {unlock.status === "success" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleContactUnlockStatusChange(unlock.id, "failed")}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "advertisers" && (
            <div className="space-y-3">
              {advertisers.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No advertisers yet.</p>
              ) : (
                advertisers.map((adv) => (
                  <div key={adv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <p className="font-medium text-text">{adv.businessName}</p>
                      <p className="text-sm text-text-secondary">{adv.category} · {adv.city} · {adv.planId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={adv.status === "active" ? "success" : adv.status === "pending" ? "warning" : adv.status === "rejected" ? "danger" : "neutral"}>
                        {adv.status}
                      </Badge>
                      {adv.status === "pending" && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => { setAdvertiserAction(adv); setAdvertiserActionType("approve"); }}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => { setAdvertiserAction(adv); setAdvertiserActionType("reject"); }}>Reject</Button>
                        </>
                      )}
                      {adv.status === "active" && (
                        <Button variant="secondary" size="sm" onClick={() => { setAdvertiserAction(adv); setAdvertiserActionType("pause"); }}>Pause</Button>
                      )}
                      {adv.status === "paused" && (
                        <Button variant="primary" size="sm" onClick={() => { setAdvertiserAction(adv); setAdvertiserActionType("reactivate"); }}>Reactivate</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-text">Support Requests</h2>
                <select
                  value={supportStatusFilter}
                  onChange={(e) => setSupportStatusFilter(e.target.value as SupportRequestStatus | "all")}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {supportRequests.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted">No support requests yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Worker</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Reason</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Description</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Created</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supportRequests
                          .filter((r) => supportStatusFilter === "all" || r.status === supportStatusFilter)
                          .map((request) => (
                            <tr key={request.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                              <td className="py-3 px-4 text-sm text-text">{request.customerId}</td>
                              <td className="py-3 px-4 text-sm text-text">{request.workerId}</td>
                              <td className="py-3 px-4 text-sm text-text capitalize">{request.reason.replace("_", " ")}</td>
                              <td className="py-3 px-4 text-sm text-text-secondary max-w-xs truncate">{request.description}</td>
                              <td className="py-3 px-4">
                                <Badge variant={request.status === "open" ? "warning" : request.status === "in_progress" ? "primary" : request.status === "resolved" ? "success" : "neutral"}>
                                  {request.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-text-secondary">
                                {new Date(request.createdAt).toLocaleDateString("en-IN")}
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={request.status}
                                  onChange={(e) => updateSupportRequestStatus(request.id, e.target.value as SupportRequestStatus)}
                                  className="px-3 py-1.5 bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-text">Audit Logs</h2>
              {auditLogs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-text-muted">No audit logs yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Admin</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Action</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Target</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Reason</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <td className="py-3 px-4 text-sm text-text">{log.adminId}</td>
                            <td className="py-3 px-4 text-sm text-text capitalize">{log.action.replace("_", " ")}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary capitalize">{log.targetType} ({log.targetId.slice(0, 8)})</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">{log.reason || "—"}</td>
                            <td className="py-3 px-4 text-sm text-text-secondary">
                              {new Date(log.createdAt).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verification Review Modal */}
      <AnimatePresence>
        {reviewingVerification && reviewAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setReviewingVerification(null); setReviewAction(null); setRejectionReason(""); setAdminNotes(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading text-text">
                  {reviewAction === "approve" ? "Approve Worker" : reviewAction === "reject" ? "Reject Worker" : "Mark Under Review"}
                </h2>
                <button
                  onClick={() => { setReviewingVerification(null); setReviewAction(null); setRejectionReason(""); setAdminNotes(""); }}
                  className="p-2 text-text-muted hover:text-text rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-text-muted">Worker</p>
                  <p className="font-medium text-text">{allWorkers.find((w) => w.id === reviewingVerification.workerId)?.name || reviewingVerification.workerId}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Current Status</p>
                  <Badge variant={reviewingVerification.status === "pending" ? "warning" : "primary"}>
                    {reviewingVerification.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Submitted Documents</p>
                  <p className="text-sm text-text">{reviewingVerification.documentReferences.length} document(s) uploaded</p>
                </div>

                {reviewAction === "reject" && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Admin Notes (optional)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Internal notes about this verification..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setReviewingVerification(null); setReviewAction(null); setRejectionReason(""); setAdminNotes(""); }}>
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === "approve" ? "primary" : reviewAction === "reject" ? "danger" : "secondary"}
                  onClick={handleVerificationAction}
                  isLoading={actionLoading}
                  disabled={actionLoading || (reviewAction === "reject" && !rejectionReason.trim())}
                >
                  {reviewAction === "approve" ? "Approve" : reviewAction === "reject" ? "Reject" : "Mark Under Review"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advertiser Action Modal */}
      <AnimatePresence>
        {advertiserAction && advertiserActionType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setAdvertiserAction(null); setAdvertiserActionType(null); setAdvertiserRejectionReason(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading text-text">
                  {advertiserActionType === "approve" ? "Approve Advertiser" : advertiserActionType === "reject" ? "Reject Advertiser" : advertiserActionType === "pause" ? "Pause Advertisement" : "Reactivate Advertisement"}
                </h2>
                <button
                  onClick={() => { setAdvertiserAction(null); setAdvertiserActionType(null); setAdvertiserRejectionReason(""); }}
                  className="p-2 text-text-muted hover:text-text rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-text-muted">Business</p>
                  <p className="font-medium text-text">{advertiserAction.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Current Status</p>
                  <Badge variant={advertiserAction.status === "active" ? "success" : advertiserAction.status === "pending" ? "warning" : advertiserAction.status === "rejected" ? "danger" : "neutral"}>
                    {advertiserAction.status}
                  </Badge>
                </div>

                {advertiserActionType === "reject" && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Rejection Reason *</label>
                    <textarea
                      value={advertiserRejectionReason}
                      onChange={(e) => setAdvertiserRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setAdvertiserAction(null); setAdvertiserActionType(null); setAdvertiserRejectionReason(""); }}>
                  Cancel
                </Button>
                <Button
                  variant={advertiserActionType === "approve" || advertiserActionType === "reactivate" ? "primary" : advertiserActionType === "reject" ? "danger" : "secondary"}
                  onClick={handleAdvertiserAction}
                  isLoading={actionLoading}
                  disabled={actionLoading || (advertiserActionType === "reject" && !advertiserRejectionReason.trim())}
                >
                  {advertiserActionType === "approve" ? "Approve" : advertiserActionType === "reject" ? "Reject" : advertiserActionType === "pause" ? "Pause" : "Reactivate"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}