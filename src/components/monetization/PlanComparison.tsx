"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CheckCircle2 } from "lucide-react";
import { Plan } from "@/types/monetization";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface PlanComparisonProps {
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PlanComparison({
  plans,
  currentPlanId,
  onSelectPlan,
  loading = false,
  disabled = false,
}: PlanComparisonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "relative rounded-3xl border-2 p-6 sm:p-8 flex flex-col",
            plan.id === "pro"
              ? "border-primary bg-white dark:bg-slate-800 shadow-xl shadow-primary/10"
              : plan.id === "basic"
              ? "border-primary/60 bg-white dark:bg-slate-800 shadow-lg"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          )}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant={plan.id === "pro" ? "primary" : "warning"} size="md">
                {plan.badge}
              </Badge>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold font-heading text-text mb-2">{plan.name}</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-text">{formatCurrency(plan.price)}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">{plan.duration}</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <CheckCircle2
                  className={cn(
                    "w-5 h-5 flex-shrink-0 mt-0.5",
                    plan.id === "pro" ? "text-primary" : "text-success"
                  )}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {currentPlanId === plan.id ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button
              variant={plan.id === "pro" ? "primary" : plan.id === "basic" ? "secondary" : "outline"}
              className="w-full"
              onClick={() => onSelectPlan?.(plan.id)}
              isLoading={loading}
              disabled={disabled || loading}
            >
              {plan.price === 0 ? "Downgrade" : "Upgrade"}
            </Button>
          )}
        </motion.div>
      ))}
    </div>
  );
}
