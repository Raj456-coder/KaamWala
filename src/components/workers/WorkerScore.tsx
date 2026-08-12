"use client";

import { motion } from "framer-motion";
import { WorkerProfile } from "@/types";
import { calculateProfileScore } from "@/services/aiSearchService";
import { cn } from "@/lib/utils";

interface WorkerScoreProps {
  worker: WorkerProfile;
  size?: "sm" | "md" | "lg";
  showFactors?: boolean;
}

export default function WorkerScore({ worker, size = "md", showFactors = false }: WorkerScoreProps) {
  const { score, factors } = calculateProfileScore(worker);

  const getColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-info";
    return "text-danger";
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    if (score >= 40) return "bg-info";
    return "bg-danger";
  };

  const sizeClasses = {
    sm: "w-16 h-16 text-xs",
    md: "w-20 h-20 text-sm",
    lg: "w-28 h-28 text-xl",
  };

  const circumference = Math.PI * 2 * 42;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg className={sizeClasses[size]} viewBox="0 0 100 100">
          <circle
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            cx="50"
            cy="50"
            r="42"
          />
          <motion.circle
            className={cn("transition-colors", getBgColor(score))}
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            cx="50"
            cy="50"
            r="42"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", getColor(score))}>{score}</span>
        </div>
      </div>
      {showFactors && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full max-w-xs"
        >
          {factors.map((factor) => (
            <div key={factor.name} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-16 text-text-muted">{factor.name}</span>
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getBgColor(factor.value))}
                  style={{ width: `${factor.value}%` }}
                />
              </div>
              <span className="w-8 text-right text-text-muted">{factor.value}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
