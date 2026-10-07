"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  ADVERTISING_PLANS,
  createAdvertiser,
  getAdvertiserByUserId,
} from "@/services/monetizationService";
import { AdPlanId } from "@/types/monetization";
import PlanComparison from "@/components/monetization/PlanComparison";

const AD_CATEGORIES = [
  "Hardware Shop",
  "Electrical Shop",
  "Paint Shop",
  "Plumbing Materials",
  "Building Materials",
  "AC / Electronics",
  "Other",
];

export default function AdvertisePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<{ status: string; planId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    category: AD_CATEGORIES[0],
    city: "",
    area: "",
    description: "",
    planId: "local" as AdPlanId,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAdvertiser = async () => {
      if (!user) return;
      setLoading(true);
      const { advertiser: adv } = await getAdvertiserByUserId(user.uid);
      if (adv) {
        setAdvertiser({ status: adv.status, planId: adv.planId });
        setForm((prev) => ({ ...prev, planId: adv.planId as AdPlanId }));
      }
      setLoading(false);
    };
    fetchAdvertiser();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (advertiser && advertiser.status === "active") {
      setError("You already have an active advertisement. Contact support to change your plan.");
      setSubmitting(false);
      return;
    }

    const result = await createAdvertiser({
      ...form,
      createdBy: user.uid,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Application submitted! Our team will review and activate your ad within 24 hours.");
      setAdvertiser({ status: "pending", planId: form.planId });
    }
    setSubmitting(false);
  };

  if (authLoading || loading || !user) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950 text-primary mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-3">
              Advertise With KaamWala
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Reach thousands of local customers looking for your services. Promote your hardware, electrical, paint, or construction business.
            </p>
          </motion.div>

          {advertiser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-center gap-3"
            >
              <Badge variant={advertiser.status === "active" ? "success" : advertiser.status === "pending" ? "warning" : "danger"}>
                Status: {advertiser.status.toUpperCase()}
              </Badge>
            </motion.div>
          )}

          {error && (
            <div className="mb-8 max-w-3xl mx-auto bg-danger-50 dark:bg-danger-950 text-danger-700 dark:text-danger-200 p-4 rounded-2xl border border-danger-200 dark:border-danger-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-8 max-w-3xl mx-auto bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-200 p-4 rounded-2xl border border-success-200 dark:border-success-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold font-heading text-text mb-6">Choose Your Plan</h2>
              <PlanComparison
                plans={ADVERTISING_PLANS}
                currentPlanId={advertiser?.planId}
                onSelectPlan={(planId) => setForm((prev) => ({ ...prev, planId: planId as AdPlanId }))}
                loading={submitting}
                disabled={!!(advertiser && advertiser.status === "active")}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold font-heading text-text mb-6">Business Details</h2>
              <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Owner Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {AD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Area</label>
                  <input
                    type="text"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-900 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full" isLoading={submitting} disabled={submitting}>
                  Submit Application
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
