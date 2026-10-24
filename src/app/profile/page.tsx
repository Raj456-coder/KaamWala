"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Heart,
  Settings,
} from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "@/services/authService";
import { FirestoreUser } from "@/types/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, role, loading: authLoading, refreshProfile } = useAuth();

  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
  });

  // Redirect if definitely not logged in after auth resolves
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, authLoading, router]);

  // Fetch Firestore user document safely
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getUserProfile(user.uid);
        if (data) {
          setUserData(data);
          setFormData({
            name: data?.name || user?.displayName || "",
            phone: data?.phone || user?.phoneNumber || "",
            city: data?.city || "",
          });
        } else {
          // If Firestore document doesn't exist yet, populate from auth
          setFormData({
            name: user?.displayName || "",
            phone: user?.phoneNumber || "",
            city: "",
          });
        }
      } catch (err) {
        console.error("[ProfilePage] Error fetching user profile:", err);
        setErrorMsg("Failed to load full profile data. Displaying available credentials.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchUserData();
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updates: Partial<FirestoreUser> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
      };

      const result = await updateUserProfile(user.uid, updates);
      if (result.error) {
        setErrorMsg(result.error.message || "Failed to update profile.");
      } else {
        setSuccessMsg("Profile updated successfully!");
        setUserData((prev) => (prev ? { ...prev, ...updates } : null));
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Safe fallback formatting for Member Since date
  const formatMemberSince = (val?: any) => {
    try {
      if (!val) {
        if (user?.metadata?.creationTime) {
          return new Date(user.metadata.creationTime).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
        }
        return "Not Provided";
      }
      if (val?.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return "Not Provided";
      return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
      return "Not Provided";
    }
  };

  // Task 3: Loading States — render spinner while waiting for auth/data
  if (authLoading || (loading && !userData)) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-28 pb-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader size="lg" text="Loading your profile details..." />
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
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-text mb-2">Access Your Profile</h1>
          <p className="text-text-secondary text-sm max-w-sm mb-6">
            Please log in with your KaamWala account to view and manage your profile details.
          </p>
          <Link href="/login">
            <Button variant="primary">Log In to Continue</Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Safe variables with Task 4 fallback strings ("Not Provided")
  const displayName = userData?.name || user?.displayName || "Not Provided";
  const displayEmail = userData?.email || user?.email || "Not Provided";
  const displayPhone = userData?.phone || user?.phoneNumber || "Not Provided";
  const displayCity = userData?.city || "Not Provided";
  const displayRole = (userData?.role || role || "customer").toUpperCase();
  const memberSince = formatMemberSince(userData?.createdAt);

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Notifications / Alerts */}
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

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </span>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-xs hover:underline font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Profile Header Hero Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={displayName}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary/10 shadow-md"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md shadow-primary/20">
                      {displayName !== "Not Provided"
                        ? displayName.slice(0, 2)
                        : displayEmail !== "Not Provided"
                        ? displayEmail.slice(0, 2)
                        : "KW"}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                </div>

                {/* Name, Email, Badge */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text">
                      {displayName}
                    </h1>
                    <Badge variant={role === "worker" ? "primary" : "neutral"} size="md">
                      {displayRole}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="w-3.5 h-3.5 text-text-muted" />
                    <span>{displayEmail}</span>
                  </p>
                  <p className="text-xs text-text-muted flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member since {memberSince}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <Link href="/dashboard" id="profile-go-dashboard-btn">
                  <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                    Dashboard
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="outline" size="sm" leftIcon={<Heart className="w-4 h-4" />}>
                    Saved
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Personal Information & Edit Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-text">Personal Details</h2>
                  <p className="text-xs text-text-secondary">Manage your contact details and location</p>
                </div>
              </div>

              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  id="profile-edit-btn"
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg(null);
                  }}
                  leftIcon={<X className="w-3.5 h-3.5" />}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Read-only view vs Edit Form */}
            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
                    Full Name
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <User className="w-4 h-4 text-primary" />
                    <span>{displayName}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="break-all">{displayEmail}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
                    Phone Number
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className={displayPhone === "Not Provided" ? "text-text-muted font-normal italic" : ""}>
                      {displayPhone}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
                    City / Location
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className={displayCity === "Not Provided" ? "text-text-muted font-normal italic" : ""}>
                      {displayCity}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajat Agrawal"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 6396661099"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text mb-1.5 uppercase tracking-wider">
                      City / Operational Area
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mathura, Uttar Pradesh"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                    id="profile-save-btn"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Account & Security Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-heading text-text">Account Information</h2>
                <p className="text-xs text-text-secondary">Security and authorization identifiers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-text-muted mb-1">User Identifier (UID)</p>
                <p className="font-mono text-text truncate">{user?.uid || "Not Provided"}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-text-muted mb-1">Account Role</p>
                <p className="font-semibold text-text capitalize">{displayRole}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-text-muted mb-1">Sign-in Provider</p>
                <p className="font-semibold text-text">
                  {user?.providerData?.[0]?.providerId || "Password / Email"}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <Link href="/settings" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                <Settings className="w-3.5 h-3.5" />
                <span>Configure Account Settings &amp; Notifications</span>
              </Link>
              <Link href="/terms" className="text-xs text-text-muted hover:underline flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Terms of Service</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

