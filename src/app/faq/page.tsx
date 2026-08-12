"use client";

import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { FAQS } from "@/constants";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

function FAQItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <h3 className="font-semibold text-text pr-4">{faq.question}</h3>
        <ChevronDown className={cn("w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <motion.div initial={false} animate={{ height: isOpen ? "auto" : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
        <div className="px-6 pb-6 text-text-secondary leading-relaxed">{faq.answer}</div>
      </motion.div>
    </motion.div>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-text-secondary">Got questions? We have got answers.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <FAQItem key={faq.id} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
