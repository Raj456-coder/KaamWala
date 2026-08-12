"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import SearchBar from "@/components/sections/SearchBar";
import CategoryCards from "@/components/sections/CategoryCards";
import FeaturesSection from "@/components/sections/FeaturesSection";
import StatisticsSection from "@/components/sections/StatisticsSection";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import Newsletter from "@/components/sections/Newsletter";
import FAQ from "@/components/sections/FAQ";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";
import RecommendationCards from "@/components/home/RecommendationCards";
import DemoModeToggle from "@/components/demo/DemoModeToggle";
import WorkerCard from "@/components/sections/WorkerCard";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { getFeaturedWorkers, mapWorkerDocsToProfiles, searchNearbyWorkers } from "@/services/firestoreService";
import { getDemoWorkers } from "@/services/demoService";
import { WorkerProfile } from "@/types";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useLocation } from "@/hooks/useLocation";
import Button from "@/components/ui/Button";
import { MapPin, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const { isDemoMode } = useDemoMode();
  const { location, status, error: locationError, detectLocation } = useLocation();

  useEffect(() => {
    const fetchWorkers = async () => {
      if (isDemoMode) {
        const { workers: demoWorkers, error } = await getDemoWorkers(6);
        if (!error && demoWorkers.length > 0) {
          setWorkers(demoWorkers);
        }
        setLoading(false);
        return;
      }

      const { workers: fetchedWorkers, error } = await getFeaturedWorkers(6);
      if (!error && fetchedWorkers.length > 0) {
        const profiles = await mapWorkerDocsToProfiles(fetchedWorkers);
        setWorkers(profiles);
      } else if (!error && fetchedWorkers.length === 0) {
        const { workers: demoWorkers } = await getDemoWorkers(6);
        setWorkers(demoWorkers);
      }
      setLoading(false);
    };

    fetchWorkers();
  }, [isDemoMode]);

  useEffect(() => {
    const fetchNearby = async () => {
      if (!location || isDemoMode) return;
      setNearbyLoading(true);
      try {
        const { workers: nearby, error } = await searchNearbyWorkers({
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm: 10,
          verifiedOnly: true,
          isAvailable: true,
          sortBy: "distance",
          limit: 6,
        });

        if (!error && nearby.length > 0) {
          const profiles = nearby.map((w) =>
            mapWorkerDocsToProfiles([w], { latitude: location.latitude, longitude: location.longitude })[0]
          );
          setNearbyWorkers(profiles);
        }
      } catch {
        // silent
      } finally {
        setNearbyLoading(false);
      }
    };

    fetchNearby();
  }, [location, isDemoMode]);

  const handleFindNearby = async () => {
    await detectLocation();
  };

  const displayNearby = nearbyWorkers.length > 0 ? nearbyWorkers : workers;

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <div className="flex justify-end px-4 sm:px-6 lg:px-8 -mt-4">
        <DemoModeToggle />
      </div>
      <SearchBar />

      {status === "idle" && (
        <section className="py-8 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary-50 dark:bg-primary-950 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text mb-1">Find trusted workers near you</h3>
                <p className="text-sm text-text-secondary">
                  {locationError || "Enable location access to discover workers closest to you."}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  onClick={handleFindNearby}
                >
                  Use My Location
                </Button>
                <Link href="/search">
                  <Button variant="outline">Choose Manually</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {status === "denied" && (
        <section className="py-8 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text mb-1">Location access is unavailable</h3>
                <p className="text-sm text-text-secondary">
                  Please select your city/area manually to find workers.
                </p>
              </div>
              <Link href="/search">
                <Button variant="outline">Choose Location Manually</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {status === "granted" && (
        <section className="py-8 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-heading text-text">
                  Nearby{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    Experts
                  </span>
                </h2>
                <p className="text-text-secondary mt-1">
                  {nearbyLoading
                    ? "Finding workers near you..."
                    : `Showing verified workers near you${nearbyWorkers.length > 0 ? ` (${nearbyWorkers.length} found)` : ""}`}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-4">
                {status === "granted" ? "Nearby" : "Featured"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Workers
                </span>
              </h2>
              <p className="text-lg text-text-secondary max-w-2xl">
                {status === "granted"
                  ? "Verified professionals available near you, ready to help with your next project."
                  : "Top-rated professionals available near you, ready to help with your next project."}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading || nearbyLoading ? (
              <>
                <WorkerCardSkeleton />
                <WorkerCardSkeleton />
                <WorkerCardSkeleton />
              </>
            ) : displayNearby.length > 0 ? (
              displayNearby.map((worker, index) => (
                <WorkerCard key={worker.id} worker={worker} index={index} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary mb-4">
                  {status === "granted"
                    ? "No verified workers found near you yet."
                    : "No featured workers available at the moment."}
                </p>
                <Link href="/search">
                  <Button variant="outline">Browse All Workers</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <CategoryCards />
      <RecommendationCards />
      <HowItWorks />
      <StatisticsSection />
      <FeaturesSection />
      <Testimonials />
      <Newsletter />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
