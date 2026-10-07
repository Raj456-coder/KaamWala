"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import WorkerCard from "@/components/workers/WorkerCard";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { searchWorkers, mapWorkerDocsToProfiles } from "@/services/firestoreService";
import { WorkerProfile } from "@/types";
import Button from "@/components/ui/Button";
import { Loader2, AlertCircle } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    let active = true;
    const loadInitialWorkers = async () => {
      setLoading(true);
      cursorRef.current = null;
      const { workers: fetchedWorkers, hasMore: more, lastDoc, error } = await searchWorkers({
        limit: 12,
        sortBy: "rating",
      });

      if (active) {
        if (!error && fetchedWorkers.length > 0) {
          const profiles = mapWorkerDocsToProfiles(fetchedWorkers);
          setWorkers(profiles);
          cursorRef.current = lastDoc;
          setHasMore(more);
        } else {
          setWorkers([]);
          setHasMore(false);
        }
        setLoading(false);
      }
    };

    loadInitialWorkers();
    return () => {
      active = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !cursorRef.current) return;
    setLoadingMore(true);

    const { workers: fetchedWorkers, hasMore: more, lastDoc, error } = await searchWorkers({
      limit: 12,
      cursor: cursorRef.current,
      sortBy: "rating",
    });

    if (!error && fetchedWorkers.length > 0) {
      const profiles = mapWorkerDocsToProfiles(fetchedWorkers);
      setWorkers((prev) => [...prev, ...profiles]);
      cursorRef.current = lastDoc;
      setHasMore(more);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">All Workers</h1>
            <p className="text-text-secondary">Browse our verified professionals</p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-2">Koi worker uplabdh nahi hai</h3>
              <p className="text-text-secondary">No workers available at the moment. Please check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {workers.map((worker, index) => (
                  <WorkerCard key={worker.id} worker={worker} index={index} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    leftIcon={loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
