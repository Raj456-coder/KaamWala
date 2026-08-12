"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Wrench,
  Paintbrush,
  Hammer,
  Settings,
  Car,
  Sparkles,
  HardHat,
  Snowflake,
  Droplets,
} from "lucide-react";
import { getCategories, CategoryWithId } from "@/services/firestoreService";
import { CategoryCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { generateGradient } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  Paintbrush: <Paintbrush className="w-6 h-6" />,
  Hammer: <Hammer className="w-6 h-6" />,
  Settings: <Settings className="w-6 h-6" />,
  Car: <Car className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  HardHat: <HardHat className="w-6 h-6" />,
  Snowflake: <Snowflake className="w-6 h-6" />,
  Droplets: <Droplets className="w-6 h-6" />,
};

export default function CategoryCards() {
  const [categories, setCategories] = useState<CategoryWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { categories: fetched, error } = await getCategories();
      if (!error && fetched.length > 0) {
        setCategories(fetched);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section id="categories" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text mb-4">
              Browse by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Category
              </span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Choose from a wide range of professional services offered by
              verified workers in your area.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <CategoryCardSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-text mb-4">
            Browse by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Category
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Choose from a wide range of professional services offered by
            verified workers in your area.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.length === 0 ? (
            <p className="text-text-secondary col-span-5 text-center py-12">
              No categories available at the moment.
            </p>
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/category/${category.slug}`}>
                  <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${generateGradient(index)} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {iconMap[category.icon] || <Zap className="w-6 h-6" />}
                    </div>
                    <h3 className="font-semibold text-text mb-1 text-center">
                      {category.name}
                    </h3>
                    <p className="text-xs text-text-secondary text-center mb-3">
                      {category.workerCount || 0} workers
                    </p>
                    <p className="text-xs text-text-muted text-center line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
