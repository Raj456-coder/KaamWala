import { hasActiveWorkerSubscription } from "@/services/monetizationService";
import { SubscriptionWithId } from "@/types/monetization";
import { WorkerDoc } from "@/types/firestore";

export function canReceiveLeads(
  worker: WorkerDoc,
  subscription: SubscriptionWithId | null | undefined
): boolean {
  if (!hasActiveWorkerSubscription(subscription)) {
    return false;
  }

  if (worker.verificationStatus === "suspended") {
    return false;
  }

  if (worker.verificationStatus === "rejected") {
    return false;
  }

  return true;
}

export function getTrialDaysRemaining(subscription: SubscriptionWithId | null | undefined): number {
  if (!subscription || subscription.status !== "trial" || !subscription.freeTrialEndDate) {
    return 0;
  }

  const nowDate = new Date();
  const endDate = new Date(subscription.freeTrialEndDate);
  const diff = endDate.getTime() - nowDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}
