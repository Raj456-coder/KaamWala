"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Newsletter() {
  return (
    <section className="py-20 bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl shadow-black/5 border border-slate-200 dark:border-slate-700 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Subscribe to our newsletter and get the latest updates on new
            services, special offers, and helpful tips.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text placeholder:text-text-muted"
            />
            <Button type="submit" size="lg" className="whitespace-nowrap">
              Subscribe
            </Button>
          </form>

          <p className="text-xs text-text-muted mt-4">
            No spam, unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
