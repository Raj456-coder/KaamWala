"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Bell, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type NotificationPreference = {
  booking: boolean;
  marketing: boolean;
  system: boolean;
};

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference>({
    booking: true,
    marketing: false,
    system: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleToggle = (key: keyof NotificationPreference) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessage("Notification preferences saved.");
    } catch {
      setMessage("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-text-secondary">Loading...</p>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950 text-primary mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-3">
              Notification Settings
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Manage what notifications you receive from KaamWala.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-6"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Booking notifications</p>
                  <p className="text-sm text-text-secondary">Updates about your booking requests, acceptances, and completions.</p>
                </div>
                <button
                  onClick={() => handleToggle("booking")}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    preferences.booking ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      preferences.booking ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">Marketing notifications</p>
                  <p className="text-sm text-text-secondary">Offers, promotions, and platform updates.</p>
                </div>
                <button
                  onClick={() => handleToggle("marketing")}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    preferences.marketing ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      preferences.marketing ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">System notifications</p>
                  <p className="text-sm text-text-secondary">Important account and security alerts.</p>
                </div>
                <button
                  onClick={() => handleToggle("system")}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    preferences.system ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      preferences.system ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-200 p-4 rounded-2xl border border-success-200 dark:border-success-800 flex items-center gap-3 mb-6"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{message}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button variant="primary" onClick={handleSave} isLoading={saving} disabled={saving}>
              Save Preferences
            </Button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
