"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { getSavedWorkers, removeSavedWorker } from "@/services/firestoreService";
import { FirestoreWorker } from "@/services/firestoreService";
import { Heart, Trash2, Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [workers, setWorkers] = useState<FirestoreWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getSavedWorkers(user.uid);
      if (result.error) {
        console.error("Failed to load favorites:", result.error);
      } else {
        setWorkers(result.workers);
      }
    } catch {
      console.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const handleRemove = async (workerId: string) => {
    if (!user) return;
    setRemovingId(workerId);
    try {
      const { error } = await removeSavedWorker(user.uid, workerId);
      if (error) {
        console.error("Failed to remove favorite:", error);
      } else {
        setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      }
    } catch {
      console.error("Failed to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-8" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <WorkerCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">
                Saved Workers
              </h1>
              <p className="text-text-secondary">
                {workers.length > 0
                  ? `You have ${workers.length} saved worker${workers.length > 1 ? "s" : ""}`
                  : "Workers you save will appear here"}
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" leftIcon={<Search className="w-4 h-4" />}>
                Find Workers
              </Button>
            </Link>
          </div>

          {workers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-3">No saved workers yet</h2>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Browse workers and tap the heart icon to save your favorite professionals for later.
              </p>
              <Link href="/search">
                <Button variant="primary" size="lg" leftIcon={<Search className="w-4 h-4" />}>
                  Discover Workers
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker, index) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold overflow-hidden">
                          {worker.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        {worker.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-text truncate">{worker.name}</h3>
                          {worker.isVerified && (
                            <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">Verified</span>
                          )}
                        </div>
                        <p className="text-sm text-primary font-medium mb-2">
                          {worker.professionalInfo?.category || worker.professionalInfo?.profession || ""}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-warning fill-warning" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium text-text">{worker.rating?.toFixed(1) || "N/A"}</span>
                            <span>({worker.reviewCount || 0})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(worker.professionalInfo?.skills || []).slice(0, 3).map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-text-muted">Hourly Rate</p>
                        <p className="font-bold text-primary text-lg">
                          ₹{worker.professionalInfo?.hourlyRate || 0}<span className="text-sm font-normal text-text-muted">/hr</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Location</p>
                        <p className="font-medium text-text text-sm line-clamp-1">
                          {worker.serviceArea?.city && worker.serviceArea?.state
                            ? `${worker.serviceArea.city}, ${worker.serviceArea.state}`
                            : "Location not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/workers/${worker.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(worker.id)}
                        disabled={removingId === worker.id}
                        leftIcon={
                          removingId === worker.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-danger" />
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
