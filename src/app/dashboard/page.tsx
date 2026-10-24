"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Heart,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile } from "@/services/authService";
import { getBookingsByCustomer } from "@/services/bookingService";
import { getCustomerFreeContactCount, getMembershipByUserId } from "@/services/monetizationService";
import { getSavedWorkers } from "@/services/firestoreService";
import { FirestoreUser, BookingDoc } from "@/types/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [freeContactCount, setFreeContactCount] = useState(0);
  const [membership, setMembership] = useState<{ planId: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect to worker dashboard if user role is worker
  useEffect(() => {
    if (!authLoading && user && role === "worker") {
      router.replace("/worker-dashboard");
    } else if (!authLoading && user && role === "admin") {
      router.replace("/admin");
    } else if (!authLoading && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [user, role, authLoading, router]);

  // Safe data fetching
  const loadDashboardData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Safe parallel requests
      const [userProfile, bookingsRes, freeCountRes, memRes, savedRes] = await Promise.allSettled([
        getUserProfile(user.uid),
        getBookingsByCustomer(user.uid),
        getCustomerFreeContactCount(user.uid),
        getMembershipByUserId(user.uid),
        getSavedWorkers(user.uid),
      ]);

      // Process user profile
      if (userProfile.status === "fulfilled" && userProfile.value) {
        setUserData(userProfile.value);
      }

      // Process bookings
      if (bookingsRes.status === "fulfilled" && !bookingsRes.value.error) {
        setBookings(bookingsRes.value.bookings || []);
      }

      // Process free contact count
      if (freeCountRes.status === "fulfilled") {
        setFreeContactCount(freeCountRes.value.count || 0);
      }

      // Process membership
      if (memRes.status === "fulfilled" && memRes.value.membership) {
        setMembership({
          planId: memRes.value.membership.planId,
          status: memRes.value.membership.status,
        });
      }

      // Process saved workers
      if (savedRes.status === "fulfilled" && !savedRes.value.error) {
        setSavedCount(savedRes.value.workers?.length || 0);
      }
    } catch (err) {
      console.error("[DashboardPage] Error loading dashboard data:", err);
      setErrorMsg("Failed to load some dashboard details. Showing available info.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid && role !== "worker") {
      loadDashboardData();
    }
  }, [user, role, loadDashboardData]);

  // Task 3: Loading States
  if (authLoading || (loading && !userData && user)) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-28 pb-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader size="lg" text="Loading your dashboard..." />
        </div>
        <Footer />
      </main>
    );
  }

  // Not authenticated fallback
  if (!user) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-28 pb-16 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-primary mb-4 shadow-sm">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-text mb-2">Access Your Dashboard</h1>
          <p className="text-text-secondary text-sm max-w-sm mb-6">
            Please log in with your KaamWala account to view and manage your dashboard.
          </p>
          <Link href="/login">
            <Button variant="primary">Log In to Continue</Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Task 4: Error Boundary Fallback for all Firestore & User fields
  const customerName = userData?.name || user?.displayName || "Not Provided";
  const customerEmail = userData?.email || user?.email || "Not Provided";
  const customerPhone = userData?.phone || user?.phoneNumber || "Not Provided";
  const customerCity = userData?.city || "Not Provided";
  const customerRole = (userData?.role || role || "Customer").toUpperCase();

  const upcomingBookings = bookings.filter(
    (b) => b?.status === "pending" || b?.status === "accepted"
  );
  const completedBookings = bookings.filter((b) => b?.status === "completed");

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header & Welcome banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-primary border border-blue-200 dark:border-blue-900">
                  {customerRole} ACCOUNT
                </span>
                <span className="text-xs text-text-muted">Welcome back</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-text">
                Dashboard Overview
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage your service bookings, trusted workers, and account details.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Link href="/profile">
                <Button variant="primary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                  My Profile
                </Button>
              </Link>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-xs hover:underline font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Active Bookings
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-primary flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text">{upcomingBookings.length}</p>
              <p className="text-xs text-text-secondary mt-1">In progress or scheduled</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Completed Jobs
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text">{completedBookings.length}</p>
              <p className="text-xs text-text-secondary mt-1">Successfully fulfilled</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Free Contact Unlocks
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text">
                {Math.max(0, 3 - freeContactCount)} / 3
              </p>
              <p className="text-xs text-text-secondary mt-1">Direct worker unlocks left</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Saved Workers
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text">{savedCount}</p>
              <p className="text-xs text-text-secondary mt-1">Bookmarked professionals</p>
            </div>
          </div>

          {/* Customer Profile Summary Card with Safe Field Fallbacks */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-text">Profile Credentials</h2>
                  <p className="text-xs text-text-secondary">
                    Registered customer details used for worker dispatches
                  </p>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Edit Details
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-text-muted block mb-1">Customer Name</span>
                <span className="font-semibold text-text text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  {customerName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-text-muted block mb-1">Email Address</span>
                <span className="font-semibold text-text text-sm flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{customerEmail}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-text-muted block mb-1">Phone Number</span>
                <span className={`font-semibold text-sm flex items-center gap-1.5 ${customerPhone === "Not Provided" ? "text-text-muted italic font-normal" : "text-text"}`}>
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {customerPhone}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-text-muted block mb-1">City / Region</span>
                <span className={`font-semibold text-sm flex items-center gap-1.5 ${customerCity === "Not Provided" ? "text-text-muted italic font-normal" : "text-text"}`}>
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {customerCity}
                </span>
              </div>
            </div>
          </div>

          {/* Active Bookings Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-primary flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-text">Recent Bookings</h2>
                  <p className="text-xs text-text-secondary">Track ongoing and scheduled service requests</p>
                </div>
              </div>
              <Link href="/customer-dashboard">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Full Management
                </Button>
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-surface border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-sm text-text-muted mb-4">You have not booked any workers yet.</p>
                <Link href="/search">
                  <Button variant="primary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
                    Find Local Workers
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-2xl bg-surface border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text text-sm">{booking?.service || "Service"}</h3>
                        <BookingStatusBadge status={booking?.status || "pending"} />
                      </div>
                      <p className="text-xs text-text-muted flex items-center gap-3">
                        {booking?.workerName && <span>Worker: {booking.workerName}</span>}
                        {booking?.date && <span>Date: {booking.date}</span>}
                        {booking?.time && <span>Time: {booking.time}</span>}
                      </p>
                    </div>

                    <Link href={`/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Membership Banner */}
          {membership && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text text-base">Active Membership: {membership.planId}</h3>
                  <p className="text-xs text-text-secondary capitalize">Status: {membership.status} · Priority Support Enabled</p>
                </div>
              </div>
              <Link href="/membership">
                <Button variant="outline" size="sm">
                  View Plan Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
