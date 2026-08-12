"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Zap } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";

export default function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
    >
      {isDemoMode && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-3 py-1.5 bg-warning-50 dark:bg-warning-950 text-warning text-xs font-medium rounded-full shadow-lg flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          Demo Mode Active
        </motion.span>
      )}
      <button
        onClick={toggleDemoMode}
        className={`relative inline-flex h-10 w-20 items-center rounded-full border-2 border-transparent text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          isDemoMode
            ? "bg-warning text-warning-foreground"
            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
        }`}
        role="switch"
        aria-checked={isDemoMode}
      >
        <span className="sr-only">Toggle demo mode</span>
        <span
          className={`inline-block h-8 w-8 transform rounded-full bg-white shadow ring-1 ring-black ring-opacity-5 transition-transform duration-200 ${
            isDemoMode ? "translate-x-5" : "translate-x-1"
          }`}
        />
        {isDemoMode ? (
          <Moon className="absolute left-1.5 top-1.5 h-4 w-4 text-warning-600" />
        ) : (
          <Sun className="absolute right-1.5 top-1.5 h-4 w-4 text-slate-500" />
        )}
      </button>
    </motion.div>
  );
}
