"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  CUSTOMER_MEMBERSHIP_PLANS,
  createOrUpdateMembership,
  getMembershipByUserId,
} from "@/services/monetizationService";
import { createPaymentOrder, processPayment, verifyPayment } from "@/services/paymentService";
import { MembershipPlanId } from "@/types/monetization";
import PlanComparison from "@/components/monetization/PlanComparison";

export default function MembershipPage() {
  const router = useRouter();
  const { user, loading: authLoading, role } = useAuth();
  const [membership, setMembership] = useState<{ planId: MembershipPlanId; status: string } | null>(null);
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
    if (role !== "customer") {
      router.push(role === "worker" ? "/worker-dashboard" : "/role-select");
      return;
    }
  }, [user, authLoading, role, router]);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return;
      setLoading(true);
      const { membership: mem } = await getMembershipByUserId(user.uid);
      if (mem) {
        setMembership({ planId: mem.planId, status: mem.status });
      }
      setLoading(false);
    };
    fetchMembership();
  }, [user]);

  const handleSelectPlan = async (planId: string) => {
    if (!user || upgrading) return;
    setUpgrading(true);
    setError(null);
    setSuccessMsg(null);

    const selectedPlan = CUSTOMER_MEMBERSHIP_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      setError("Invalid plan selected.");
      setUpgrading(false);
      return;
    }

    if (planId === "free") {
      const result = await createOrUpdateMembership(user.uid, "free", "active");
      if (result.error) {
        setError(result.error);
      } else {
        setMembership({ planId: "free", status: "active" });
        setSuccessMsg("Switched to Free plan.");
      }
      setUpgrading(false);
      return;
    }

    const result = await createOrUpdateMembership(user.uid, planId as MembershipPlanId, "pending");
    if (result.error) {
      setError(result.error);
      setUpgrading(false);
      return;
    }

    setMembership({ planId: planId as MembershipPlanId, status: "pending" });

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      setError(
        "Plan selected (pending activation). Payment provider is not configured yet — an administrator can activate your membership in the Admin Dashboard."
      );
      setUpgrading(false);
      return;
    }

    const { orderId, error: orderErr } = await createPaymentOrder(
      user.uid,
      "customer_membership",
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
      name: user.displayName || "Customer",
      description: `${selectedPlan.name} Membership`,
      orderId,
      userId: user.uid,
      membershipId: result.id,
      onSuccess: async (response) => {
        const verifyRes = await verifyPayment(
          orderId,
          response.razorpay_payment_id,
          response.razorpay_signature,
          undefined,
          user.uid,
          { membershipId: result.id, userId: user.uid }
        );
        if (verifyRes.success) {
          setMembership({ planId: planId as MembershipPlanId, status: "active" });
          setSuccessMsg(`Your ${selectedPlan.name} membership has been activated!`);
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

  if (authLoading || loading || !user || role !== "customer") {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning-50 dark:bg-warning-950 text-warning mb-4">
              <Crown className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-3">
              Premium Membership
            </h1>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Unlock priority discovery, enhanced recommendations, and exclusive offers.
            </p>
          </motion.div>

          {membership && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center justify-center gap-3"
            >
              <Badge variant={membership.status === "active" ? "success" : "warning"}>
                Current: {membership.planId.toUpperCase()} · {membership.status}
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
            plans={CUSTOMER_MEMBERSHIP_PLANS}
            currentPlanId={membership?.planId}
            onSelectPlan={handleSelectPlan}
            loading={upgrading}
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}
