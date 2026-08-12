"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Lock, MapPin } from "lucide-react";
import { FEATURES } from "@/constants";

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <Shield className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Lock: <Lock className="w-8 h-8" />,
  MapPin: <MapPin className="w-8 h-8" />,
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text mb-4">
            Why Choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              KaamWala
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            We make hiring local workers safe, fast, and hassle-free with our
            trusted platform and verified professionals.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-surface dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/25">
                {iconMap[feature.icon] || <Shield className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-text mb-3">
                {feature.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



