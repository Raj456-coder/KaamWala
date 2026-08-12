"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SearchWorkerCard from "@/components/search/WorkerCard";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { searchWorkers, mapWorkerDocsToProfiles } from "@/services/firestoreService";
import { getDemoWorkers } from "@/services/demoService";
import { WorkerProfile } from "@/types";
import Button from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>(undefined);

  const fetchWorkers = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setWorkers([]);
      setCursor(undefined);
    } else {
      setLoadingMore(true);
    }

    const params = {
      limit: 12,
      cursor: reset ? undefined : cursor,
      sortBy: "rating" as const,
      verifiedOnly: true,
    };

    const { workers: fetchedWorkers, hasMore: more, lastDoc: newCursor, error } = await searchWorkers(params);

    if (!error && fetchedWorkers.length > 0) {
      const profiles = await mapWorkerDocsToProfiles(fetchedWorkers);
       setWorkers((prev) => reset ? profiles : [...prev, ...profiles]);
      setCursor(newCursor ?? undefined);
      setHasMore(more && fetchedWorkers.length === 12);
    } else if (reset) {
      const { workers: demoWorkers } = await getDemoWorkers(12);
      setWorkers(demoWorkers);
      setHasMore(false);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [cursor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkers(true);
  }, [fetchWorkers]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchWorkers(false);
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
            <div className="text-center py-20">
              <p className="text-xl text-text-secondary mb-4">No workers found.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {workers.map((worker, index) => (
                  <SearchWorkerCard key={worker.id} worker={worker} index={index} />
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
