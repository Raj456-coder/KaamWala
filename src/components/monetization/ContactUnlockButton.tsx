"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Lock, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { ContactUnlockWithId } from "@/types/monetization";
import { formatCurrency } from "@/lib/utils";

interface ContactUnlockButtonProps {
  workerId?: string;
  workerName: string;
  phoneNumber?: string;
  unlock?: ContactUnlockWithId | null;
  onUnlockRequest?: () => void;
  loading?: boolean;
}

export default function ContactUnlockButton({
  workerName,
  phoneNumber,
  unlock,
  onUnlockRequest,
  loading = false,
}: ContactUnlockButtonProps) {
  const isUnlocked = !!unlock && unlock.status === "success";

  if (isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-success/30 bg-success-50 dark:bg-success-950 p-4 sm:p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h4 className="font-semibold text-text">Contact Unlocked</h4>
        </div>
        {phoneNumber && (
          <a
            href={`tel:${phoneNumber}`}
            className="inline-flex items-center gap-2 text-lg font-bold text-primary hover:underline"
          >
            <Phone className="w-4 h-4" />
            {phoneNumber}
          </a>
        )}
        <p className="text-xs text-text-muted mt-2">
          You can call or message this worker directly.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <Lock className="w-5 h-5 text-warning" />
        <h4 className="font-semibold text-text">Contact Locked</h4>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Unlock {workerName}&apos;s phone number for just{" "}
        <span className="font-bold text-text">{formatCurrency(10)}</span> to call or message directly.
      </p>
      <Button
        variant="primary"
        className="w-full"
        onClick={onUnlockRequest}
        isLoading={loading}
        disabled={loading}
        leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
      >
        {loading ? "Processing..." : "Unlock Contact"}
      </Button>
      <p className="text-xs text-text-muted mt-2 text-center">
        One-time payment. Permanent access.
      </p>
    </motion.div>
  );
}
