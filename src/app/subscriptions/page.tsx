"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  WORKER_SUBSCRIPTION_PLANS,
  createOrUpdateSubscription,
  getSubscriptionByUserId,
} from "@/services/monetizationService";
import { createPaymentOrder, processPayment, verifyPayment } from "@/services/paymentService";
import { SubscriptionPlanId } from "@/types/monetization";
import PlanComparison from "@/components/monetization/PlanComparison";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [subscription, setSubscription] = useState<{ planId: SubscriptionPlanId; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (role !== "worker") {
      router.push(role === "customer" ? "/customer-dashboard" : "/role-select");
      return;
    }
  }, [user, authLoading, role, router]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      setLoading(true);
      const { subscription: sub } = await getSubscriptionByUserId(user.uid);
      if (sub) {
        setSubscription({ planId: sub.planId, status: sub.status });
      }
      setLoading(false);
    };
    fetchSubscription();
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user || upgrading) return;
    setUpgrading(true);
    setError(null);
    setSuccessMsg(null);

    const selectedPlan = WORKER_SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      setError("Invalid plan selected.");
      setUpgrading(false);
      return;
    }

    if (planId === "free") {
      const result = await createOrUpdateSubscription(user.uid, "free", "active");
      if (result.error) {
        setError(result.error);
      } else {
        setSubscription({ planId: "free", status: "active" });
        setSuccessMsg("Switched to Free plan.");
      }
      setUpgrading(false);
      return;
    }

    const result = await createOrUpdateSubscription(user.uid, planId as SubscriptionPlanId, "pending");
    if (result.error) {
      setError(result.error);
      setUpgrading(false);
      return;
    }

    setSubscription({ planId: planId as SubscriptionPlanId, status: "pending" });

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      setError(
        "Plan selected (pending activation). Payment provider is not configured yet — an administrator can activate your subscription in the Admin Dashboard."
      );
      setUpgrading(false);
      return;
    }

    const { orderId, error: orderErr } = await createPaymentOrder(
      user.uid,
      "worker_subscription",
      selectedPlan.price,
      result.id
    );

    if (orderErr || !orderId) {
      setError(orderErr || "Failed to create payment order.");
      setUpgrading(false);
      return;
    }

    await processPayment({
      amount: selectedPlan.price,
      name: user.displayName || "Worker",
      description: `${selectedPlan.name} Subscription`,
      orderId,
      userId: user.uid,
      subscriptionId: result.id,
      onSuccess: async (response) => {
        const verifyRes = await verifyPayment(
          orderId,
          response.razorpay_payment_id,
          response.razorpay_signature,
          undefined,
          user.uid,
          { subscriptionId: result.id, userId: user.uid }
        );
        if (verifyRes.success) {
          setSubscription({ planId: planId as SubscriptionPlanId, status: "active" });
          setSuccessMsg(`Your ${selectedPlan.name} subscription has been activated!`);
        } else {
          setError(verifyRes.error || "Payment verification failed.");
        }
        setUpgrading(false);
      },
      onFailure: (errMsg) => {
        setError(errMsg);
        setUpgrading(false);
      },
    });
  };

  if (authLoading || loading || !user || role !== "worker") {
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
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-3">
              Worker Subscription Plans
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Choose the plan that fits your business. Upgrade anytime to get more visibility and leads.
            </p>
          </motion.div>

          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-center gap-3"
            >
              <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                Current: {subscription.planId.toUpperCase()} · {subscription.status}
              </Badge>
            </motion.div>
          )}

          {successMsg && (
            <div className="mb-8 max-w-3xl mx-auto bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-200 p-4 rounded-2xl border border-success-200 dark:border-success-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {error && (
            <div className="mb-8 max-w-3xl mx-auto bg-warning-50 dark:bg-warning-950 text-warning-700 dark:text-warning-200 p-4 rounded-2xl border border-warning-200 dark:border-warning-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <PlanComparison
            plans={WORKER_SUBSCRIPTION_PLANS}
            currentPlanId={subscription?.planId}
            onSelectPlan={handleSelectPlan}
            loading={upgrading}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold font-heading text-text mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-secondary">
              <div>
                <h4 className="font-semibold text-text mb-1">Can I cancel anytime?</h4>
                <p>Yes. You can cancel your subscription at any time from your dashboard. Benefits continue until the end of your billing period.</p>
              </div>
              <div>
                <h4 className="font-semibold text-text mb-1">When does my plan activate?</h4>
                <p>Plans activate immediately after payment verification. This sprint includes payment-ready architecture; connect a provider to enable live payments.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
