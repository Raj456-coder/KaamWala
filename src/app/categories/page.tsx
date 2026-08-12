"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { getCategories, FirestoreCategory } from "@/services/firestoreService";
import { CategoryCardSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { generateGradient } from "@/lib/utils";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
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
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">All Categories</h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Choose from a wide range of professional services offered by verified workers.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">All Categories</h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Choose from a wide range of professional services offered by verified workers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.length === 0 ? (
              <p className="text-text-secondary col-span-4 text-center py-12">
                No categories available at the moment.
              </p>
            ) : (
              categories.map((category, index) => (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center h-full">
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${generateGradient(index)} flex items-center justify-center text-white mb-4`}>
                      <span className="text-2xl font-bold">{category.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-semibold text-text mb-1">{category.name}</h3>
                    <p className="text-xs text-text-secondary">{category.workerCount || 0} workers</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
