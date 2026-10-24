"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertOctagon } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900/50 shadow-sm">
          <AlertOctagon className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold font-heading text-text mb-3">
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          We encountered an unexpected error while loading this page. Please try again or return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-primary hover:bg-primary-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-surface hover:bg-surface-alt border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all text-text active:scale-95"
          >
            <Home className="w-4 h-4 text-text-secondary" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
