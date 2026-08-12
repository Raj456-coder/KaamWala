"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { BookingDoc } from "@/types/firestore";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  booking: BookingDoc;
}

const STATUS_FLOW: Record<string, string[]> = {
  accepted: ["pending", "accepted"],
  rejected: ["pending", "rejected"],
  cancelled: ["pending", "cancelled"],
  completed: ["pending", "accepted", "in-progress", "completed"],
};

export default function StatusTimeline({ booking }: StatusTimelineProps) {
  const flow = STATUS_FLOW[booking.status] || ["pending"];
  const steps = [
    { key: "pending", label: "Booking Requested", icon: Clock },
    { key: "accepted", label: "Accepted", icon: CheckCircle2 },
    { key: "in-progress", label: "Service In Progress", icon: Loader2 },
    { key: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  const currentIndex = flow.findIndex((s) => s === booking.status);
  const isTerminal = ["rejected", "cancelled", "completed"].includes(booking.status);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const isActive = flow.includes(step.key);
          const isCurrent = isTerminal
            ? booking.status === step.key
            : index <= currentIndex && index < flow.length;
          const isLast = index === steps.length - 1;

          if (!isActive && !isLast) return null;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCurrent
                      ? "bg-primary border-primary text-white"
                      : "bg-surface-alt border-slate-200 text-text-muted"
                  )}
                >
                  <step.icon className={cn("w-5 h-5", step.key === "in-progress" && "animate-spin")} />
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 text-center font-medium",
                    isCurrent ? "text-text" : "text-text-muted"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCurrent ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary origin-left"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {booking.status === "rejected" && (
        <div className="flex items-center gap-2 text-danger mt-4">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Booking was declined</span>
        </div>
      )}
      {booking.status === "cancelled" && (
        <div className="flex items-center gap-2 text-warning mt-4">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Booking was cancelled</span>
        </div>
      )}
    </div>
  );
}
