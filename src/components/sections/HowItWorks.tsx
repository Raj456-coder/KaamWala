"use client";

import { motion } from "framer-motion";
import { Search, CheckCircle2, Users } from "lucide-react";
import { HOW_IT_WORKS } from "@/constants";

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search className="w-8 h-8" />,
  CheckCircle: <CheckCircle2 className="w-8 h-8" />,
  Users: <Users className="w-8 h-8" />,
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text mb-4">
            How It{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Works
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Getting help is simple. Just three easy steps and you&apos;re
            connected with the perfect worker for your needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          {HOW_IT_WORKS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30">
                    {iconMap[step.icon] || <Search className="w-8 h-8" />}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-text mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
