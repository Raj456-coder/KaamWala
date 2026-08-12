"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, MapPin, Clock } from "lucide-react";
import SearchWorkerCard from "@/components/search/WorkerCard";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { searchWorkers, mapWorkerDocsToProfiles } from "@/services/firestoreService";
import { rankWorkers, rankWorkersByRecency } from "@/services/aiSearchService";
import { WorkerProfile } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface RecommendationSectionProps {
  title: string;
  subtitle: string;
  workers: WorkerProfile[];
  icon: React.ReactNode;
  loading: boolean;
  badge?: string;
}

function RecommendationSection({ title, subtitle, workers, icon, loading, badge }: RecommendationSectionProps) {
  if (loading) {
    return (
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          {icon}
          <div>
            <h2 className="text-2xl font-bold font-heading text-text">{title}</h2>
            <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <WorkerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (workers.length === 0) return null;

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h2 className="text-2xl font-bold font-heading text-text">{title}</h2>
            <p className="text-sm text-text-secondary">{subtitle}</p>
          </div>
        </div>
        {badge && <Badge variant="primary" className="bg-warning-50 dark:bg-warning-950 text-warning dark:text-warning-300 rounded-full px-3 py-1">{badge}</Badge>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {workers.map((worker, index) => (
          <SearchWorkerCard key={worker.id} worker={worker} index={index} />
        ))}
      </div>
    </div>
  );
}

export default function RecommendationCards() {
  const [recommended, setRecommended] = useState<WorkerProfile[]>([]);
  const [topRated, setTopRated] = useState<WorkerProfile[]>([]);
  const [recent, setRecent] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    setLoading(true);

    const commonParams = { limit: 40, verifiedOnly: true, sortBy: "rating" as const };

    const { workers: allWorkers, error } = await searchWorkers(commonParams);
    if (!error && allWorkers.length > 0) {
      const profiles = await mapWorkerDocsToProfiles(allWorkers);

      const ranked = rankWorkers(profiles);
      setRecommended(ranked.slice(0, 4).map((r) => r.worker));

      const topRatedSorted = [...profiles].sort((a, b) => b.rating - a.rating);
      setTopRated(topRatedSorted.slice(0, 4));

      const recentWorkers = rankWorkersByRecency(profiles, 30);
      setRecent(recentWorkers);
    }

    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecommendations();
  }, []);

  if (loading && recommended.length === 0 && topRated.length === 0 && recent.length === 0) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading text-text mb-4">Recommended For You</h2>
            <p className="text-text-secondary">Loading personalized recommendations...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <WorkerCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RecommendationSection
          title="Recommended For You"
          subtitle="AI-powered picks based on your preferences"
          workers={recommended}
          icon={<Star className="w-7 h-7 text-warning" />}
          loading={loading && recommended.length === 0}
          badge="Best Match"
        />

        <RecommendationSection
          title="Top Rated Workers"
          subtitle="Highest rated verified professionals"
          workers={topRated}
          icon={<Star className="w-7 h-7 text-warning fill-current" />}
          loading={loading && topRated.length === 0}
          badge="⭐ Top Rated"
        />

        <RecommendationSection
          title="Recently Active"
          subtitle="Workers who joined recently"
          workers={recent}
          icon={<Clock className="w-7 h-7 text-primary" />}
          loading={loading && recent.length === 0}
        />

        {(recommended.length > 0 || topRated.length > 0 || recent.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/search">
              <Button size="lg" rightIcon={<MapPin className="w-5 h-5" />}>
                Find More Workers
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
