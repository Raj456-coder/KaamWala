"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-950 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-6xl sm:text-8xl font-bold font-heading text-text mb-4">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">Page Not Found</h2>
              <p className="text-text-secondary max-w-md mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to finding great help.
              </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </motion.button>
          </Link>
          <Link href="/search">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4 text-text-secondary" />
              Find Workers
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
