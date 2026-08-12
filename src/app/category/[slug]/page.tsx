"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SearchWorkerCard from "@/components/search/WorkerCard";
import { getCategories, searchWorkers, mapWorkerDocsToProfiles } from "@/services/firestoreService";
import { CategoryWithId } from "@/services/firestoreService";
import { WorkerProfile } from "@/types";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [category, setCategory] = useState<CategoryWithId | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { categories, error: catError } = await getCategories();
      if (!catError) {
        const found = categories.find((c) => c.slug === slug);
        setCategory(found || null);

        if (found) {
          const { workers: fetchedWorkers, error: workersError } = await searchWorkers({
            category: found.slug,
            limit: 24,
            sortBy: "rating",
          });
          if (!workersError && fetchedWorkers.length > 0) {
            const profiles = await mapWorkerDocsToProfiles(fetchedWorkers);
            setWorkers(profiles);
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">
                Loading...
              </h1>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/categories" className="text-sm text-primary hover:underline mb-2 inline-block">← Back to Categories</Link>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">{category.name} Workers</h1>
            <p className="text-text-secondary">{category.description}</p>
          </div>

          {workers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-text-secondary">No workers found in this category yet.</p>
              <Link href="/search"><Button className="mt-4">Search Workers</Button></Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {workers.map((worker, index) => (
                <SearchWorkerCard key={worker.id} worker={worker} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
