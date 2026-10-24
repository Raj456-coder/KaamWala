"use client";

import { useEffect } from "react";
import { RefreshCw, AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global root layout error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900/50">
            <AlertOctagon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Error</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            A critical error occurred while rendering the application. Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
