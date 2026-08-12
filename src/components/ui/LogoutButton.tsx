"use client";

import { useState } from "react";
import { logoutUser } from "@/services/authService";
import { cn } from "@/lib/utils";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "text";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export default function LogoutButton({
  variant = "default",
  size = "md",
  showIcon = true,
  className,
  onSuccess,
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutUser();
    setIsLoading(false);
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.href = "/login";
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        variant === "default" &&
          "bg-primary text-white hover:bg-primary/90",
        variant === "ghost" &&
          "bg-transparent text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800",
        variant === "text" &&
          "bg-transparent text-text-secondary hover:text-primary underline-offset-2 hover:underline",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      Logout
    </button>
  );
}
