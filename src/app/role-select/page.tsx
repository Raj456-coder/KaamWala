"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  CheckCircle2,
  Search,
  Calendar,
  Settings,
  UserPlus,
  Bell,
  Star,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/services/authService";
import { UserRole } from "@/types/firestore";

type Role = "customer" | "worker" | null;

export default function RoleSelectPage() {
  const { user, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  const handleContinue = useCallback(async () => {
    if (!selectedRole || !user) return;
    setIsLoading(true);

    const role: UserRole = selectedRole;
    const { error } = await updateUserProfile(user.uid, { role });

    if (error) {
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      if (role === "customer") {
        window.location.href = "/customer-dashboard";
      } else {
        window.location.href = "/become-worker";
      }
    }, 1200);
  }, [selectedRole, user]);

  return (
    <main className="min-h-screen bg-surface">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary-700 to-primary-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/30 to-secondary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold font-heading text-white mb-4 leading-tight">
                Choose Your Role
              </h1>

              <p className="text-lg text-primary-100 max-w-md mb-8 leading-relaxed">
                Select how you want to use KaamWala and we&apos;ll tailor
                your experience.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: <Search className="w-5 h-5" />,
                    text: "Find and hire verified workers",
                    color: "bg-success/20 text-success",
                  },
                  {
                    icon: <Calendar className="w-5 h-5" />,
                    text: "Manage bookings and payments",
                    color: "bg-warning/20 text-warning",
                  },
                  {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    text: "Secure and trusted platform",
                    color: "bg-primary-50 text-primary",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        item.color
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm text-white/90">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-3xl"
          >
            <div className="lg:hidden mb-6 text-center">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-text">
                Choose Your Role
              </h1>
              <p className="text-text-secondary text-sm mt-1.5">
                Select how you want to use KaamWala
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole("customer")}
                className={cn(
                  "relative cursor-pointer rounded-3xl border-2 p-6 sm:p-8 transition-all duration-300",
                  selectedRole === "customer"
                    ? "border-primary bg-primary/5 dark:bg-primary-950 shadow-xl shadow-primary/20"
                    : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                )}
                role="button"
                tabIndex={0}
                aria-pressed={selectedRole === "customer"}
                aria-label="Select Customer role"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedRole("customer");
                  }
                }}
              >
                {selectedRole === "customer" && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" fill="white" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
                    selectedRole === "customer"
                      ? "bg-primary text-white"
                      : "bg-primary-50 text-primary dark:bg-primary-950"
                  )}
                >
                  <Users className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold font-heading text-text mb-2">
                  Customer
                </h3>
                <p className="text-text-secondary text-sm mb-5">
                  I want to hire trusted workers.
                </p>

                <div className="space-y-3">
                  {[
                    { icon: <Search className="w-4 h-4" />, text: "Find verified workers" },
                    { icon: <Calendar className="w-4 h-4" />, text: "Book services" },
                    { icon: <Settings className="w-4 h-4" />, text: "Manage bookings" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                          selectedRole === "customer"
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-text-muted dark:bg-slate-900"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={cn(
                          "transition-colors duration-200",
                          selectedRole === "customer"
                            ? "text-text"
                            : "text-text-secondary"
                        )}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Worker Card */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole("worker")}
                className={cn(
                  "relative cursor-pointer rounded-3xl border-2 p-6 sm:p-8 transition-all duration-300",
                  selectedRole === "worker"
                    ? "border-secondary bg-secondary/5 dark:bg-secondary-950 shadow-xl shadow-secondary/20"
                    : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/5"
                )}
                role="button"
                tabIndex={0}
                aria-pressed={selectedRole === "worker"}
                aria-label="Select Worker role"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedRole("worker");
                  }
                }}
              >
                {selectedRole === "worker" && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" fill="white" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
                    selectedRole === "worker"
                      ? "bg-secondary text-white"
                      : "bg-secondary-50 text-secondary dark:bg-secondary-950"
                  )}
                >
                  <Briefcase className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold font-heading text-text mb-2">
                  Worker
                </h3>
                <p className="text-text-secondary text-sm mb-5">
                  I want to earn by providing professional services.
                </p>

                <div className="space-y-3">
                  {[
                    { icon: <UserPlus className="w-4 h-4" />, text: "Create your profile" },
                    { icon: <Bell className="w-4 h-4" />, text: "Receive hiring requests" },
                    { icon: <Star className="w-4 h-4" />, text: "Manage jobs" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                          selectedRole === "worker"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-slate-100 text-text-muted dark:bg-slate-900"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={cn(
                          "transition-colors duration-200",
                          selectedRole === "worker"
                            ? "text-text"
                            : "text-text-secondary"
                        )}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Continue Button */}
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={
                  isLoading
                    ? undefined
                    : <ArrowRight className="w-4 h-4" />
                }
                disabled={!selectedRole || isLoading}
                isLoading={isLoading}
                onClick={handleContinue}
              >
                {isLoading
                  ? "Setting up..."
                  : "Continue" +
                    (selectedRole === "customer"
                      ? " as Customer"
                      : selectedRole === "worker"
                      ? " as Worker"
                      : "")}
              </Button>
            </div>

            {/* Bottom Link */}
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors duration-200 group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform duration-200 inline-flex">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                Already have an account? Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        *:focus-visible {
          outline: 2px solid rgba(37, 99, 235, 0.5);
          outline-offset: 2px;
          border-radius: 4px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}