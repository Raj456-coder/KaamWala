"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className,
}: BadgeProps) {
  const variants = {
    primary: "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300",
    success:
      "bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-300",
    warning:
      "bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-300",
    danger: "bg-danger-50 text-danger-600 dark:bg-danger-950 dark:text-danger-300",
    neutral:
      "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs font-medium",
    md: "px-3 py-1 text-sm font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
