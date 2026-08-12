"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, RefreshCw, AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-danger-50 dark:bg-danger-950 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-12 h-12 text-danger" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading text-text mb-2">
              Something went wrong
            </h1>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
              An unexpected error occurred. Don&apos;t worry, our team has been notified.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4 text-text-secondary" />
                Back to Home
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
