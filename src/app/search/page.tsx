"use client";

import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SearchFiltersPanel from "@/components/search/SearchFilters";
import SearchWorkerCard from "@/components/search/WorkerCard";
import FilterChips from "@/components/search/FilterChips";
import AiAssistantPanel from "@/components/search/AiAssistantPanel";
import { searchWorkers, mapWorkerDocsToProfiles, searchNearbyWorkers } from "@/services/firestoreService";
import { getDemoWorkers } from "@/services/demoService";
import { RankedWorker } from "@/services/aiSearchService";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { SearchFilters, WorkerProfile } from "@/types";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Loader2, X, Star, MapPin, AlertCircle, TrendingUp } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useLocation } from "@/hooks/useLocation";
import { defaultAIProvider } from "@/lib/ai/provider";
import { trackSearchEvent, persistSearchToFirestore } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";

const initialFilters: SearchFilters = {
  category: undefined,
  location: undefined,
  keyword: undefined,
  minRating: undefined,
  maxDistance: undefined,
  availability: undefined,
  verifiedOnly: undefined,
  experience: undefined,
  priceRange: undefined,
  sortBy: "rating",
};

function filterWorkers(workers: WorkerProfile[], filters: SearchFilters) {
  let filtered = [...workers];

  if (filters.category) {
    filtered = filtered.filter((w) => w.categorySlug === filters.category);
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    filtered = filtered.filter((w) => w.location.toLowerCase().includes(loc));
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    filtered = filtered.filter((w) =>
      w.name.toLowerCase().includes(kw) ||
      w.category.toLowerCase().includes(kw) ||
      w.skills.some((s) => s.toLowerCase().includes(kw)) ||
      w.description.toLowerCase().includes(kw)
    );
  }
  if (filters.minRating) {
    filtered = filtered.filter((w) => w.rating >= filters.minRating!);
  }
  if (filters.availability) {
    filtered = filtered.filter((w) => w.isAvailable);
  }
  if (filters.verifiedOnly) {
    filtered = filtered.filter((w) => w.isVerified);
  }

  if (filters.experience && filters.experience.length === 2) {
    const [min, max] = filters.experience;
    filtered = filtered.filter((w) => w.experience >= min && w.experience <= max);
  }
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    filtered = filtered.filter((w) => w.hourlyRate >= min && w.hourlyRate <= max);
  }

  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "rating": return b.rating - a.rating;
      case "distance": return a.distance.localeCompare(b.distance);
      case "price": return a.hourlyRate - b.hourlyRate;
      case "experience": return b.experience - a.experience;
      case "newest": return parseInt(b.id) - parseInt(a.id);
      default: return 0;
    }
  });

  return filtered;
}

const PAGE_SIZE = 12;

export default function SearchPage() {
  const { isDemoMode } = useDemoMode();
  const { location, status, error: locationError, detectLocation } = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [allWorkers, setAllWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kaamwalaSearchHistory");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [rankedResults, setRankedResults] = useState<RankedWorker[]>([]);
  const [usingAiSearch, setUsingAiSearch] = useState(false);
  const [useNearby, setUseNearby] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [noResultSuggestions, setNoResultSuggestions] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setSearchError(null);

    if (isDemoMode) {
      const { workers, error } = await getDemoWorkers(50);
      if (!error && workers.length > 0) {
        setAllWorkers(workers);
      }
      setLoading(false);
      return;
    }

    if (useNearby && location) {
      const radius = filters.maxDistance || 10;

      const { workers, error } = await searchNearbyWorkers({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: radius,
        verifiedOnly: filters.verifiedOnly,
        isAvailable: filters.availability,
        category: filters.category,
        minRating: filters.minRating,
        sortBy: filters.sortBy as "distance" | "rating" | "price" | "experience",
        limit: 100,
      });

      if (!error && workers.length > 0) {
        const profiles = workers.map((w) =>
          mapWorkerDocsToProfiles([w], { latitude: location.latitude, longitude: location.longitude })[0]
        );
        setAllWorkers(profiles);
      } else if (!error && workers.length === 0) {
        const { workers: demoWorkers } = await getDemoWorkers(50);
        setAllWorkers(demoWorkers);
      } else if (error) {
        const { workers: demoWorkers } = await getDemoWorkers(50);
        setAllWorkers(demoWorkers);
      }
      setLoading(false);
      return;
    }

    const { workers, error } = await searchWorkers({
      limit: 100,
      sortBy: filters.sortBy || "rating",
      verifiedOnly: filters.verifiedOnly,
      category: filters.category,
      minRating: filters.minRating,
      isAvailable: filters.availability,
    });

    if (!error && workers.length > 0) {
      const profiles = await mapWorkerDocsToProfiles(workers);
      setAllWorkers(profiles);
    } else {
      const { workers: demoWorkers } = await getDemoWorkers(50);
      setAllWorkers(demoWorkers);
    }
    setLoading(false);
  }, [isDemoMode, useNearby, location, filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, useNearby, location, filters.sortBy, filters.verifiedOnly, filters.category, filters.minRating, filters.availability, filters.maxDistance]);

  const performAiSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsAiSearching(true);
    setSearchError(null);
    setAiSummary(null);
    setNoResultSuggestions([]);

    try {
      const intent = await defaultAIProvider.extractIntent(query, location ? { location } : undefined);

      if (intent.service) {
        setFilters((prev) => ({ ...prev, category: intent.service }));
      }
      const loc = intent.location;
      if (loc && loc !== "current") {
        setFilters((prev) => ({ ...prev, location: loc }));
      }
      if (intent.availability === "today") {
        setFilters((prev) => ({ ...prev, availability: true }));
      }
      const radiusKm = intent.radiusKm;
      if (radiusKm) {
        setFilters((prev) => ({ ...prev, maxDistance: radiusKm }));
      }

      const ranked = await defaultAIProvider.rankWorkers(allWorkers, intent);
      setRankedResults(ranked.map((w) => ({ worker: w, score: 0 })));
      setUsingAiSearch(true);

      const summary = await defaultAIProvider.generateSummary(intent, ranked.length);
      setAiSummary(summary);

      if (ranked.length === 0) {
        const suggestions = await defaultAIProvider.getNoResultSuggestions(intent);
        setNoResultSuggestions(suggestions);
      }

      if (!searchHistory.includes(query)) {
        const newHistory = [query, ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
        localStorage.setItem("kaamwalaSearchHistory", JSON.stringify(newHistory));

        if (user?.uid) {
          persistSearchToFirestore(user.uid, query, ranked.length).catch(() => {});
        }
      }

      trackSearchEvent({
        event: "search_completed",
        query,
        resultCount: ranked.length,
      });
    } catch {
      setSearchError("AI search encountered an issue. Showing all available workers.");
      setUsingAiSearch(false);
      setRankedResults([]);
      trackSearchEvent({
        event: "search_no_results",
        query,
      });
    } finally {
      setIsAiSearching(false);
    }
  }, [allWorkers, location, searchHistory, user]);

  const handleFilterToggle = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
    setFilters((prev) => {
      const next = { ...prev };
      switch (filterId) {
        case "available":
          next.availability = prev.availability ? undefined : true;
          break;
        case "verified":
          next.verifiedOnly = prev.verifiedOnly ? undefined : true;
          break;
        case "topRated":
          next.minRating = prev.minRating ? undefined : 4;
          break;
        case "budget":
          next.priceRange = prev.priceRange ? undefined : [0, 300];
          next.sortBy = "price";
          break;
        case "nearest":
          next.sortBy = "distance";
          break;
        case "experienced":
          next.experience = prev.experience ? undefined : [5, 100];
          break;
        case "nearby":
          setUseNearby(!useNearby);
          if (!useNearby && !location) {
            detectLocation();
          }
          break;
      }
      return next;
    });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setUsingAiSearch(false);
    setRankedResults([]);
    setAiSummary(null);
    setNoResultSuggestions([]);
    setSearchError(null);
  };

  const filteredWorkers = useMemo(() => filterWorkers(allWorkers, filters), [allWorkers, filters]);

  const displayWorkers = usingAiSearch && rankedResults.length > 0
    ? rankedResults.map((r) => r.worker)
    : filteredWorkers;

  const totalPages = Math.ceil(displayWorkers.length / PAGE_SIZE);
  const paginatedWorkers = useMemo(() => {
    const end = currentPage * PAGE_SIZE;
    return displayWorkers.slice(0, end);
  }, [displayWorkers, currentPage]);

  const handleClear = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
    setUsingAiSearch(false);
    setRankedResults([]);
    setAiSummary(null);
    setNoResultSuggestions([]);
  };

  const hasMore = currentPage < totalPages;

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text mb-2">Find Workers</h1>
            <p className="text-text-secondary">Discover trusted professionals for any job</p>
          </div>

          <div className="mb-6">
            <AiAssistantPanel
              query={searchQuery}
              onSearch={performAiSearch}
              onClear={handleClearSearch}
              isSearching={isAiSearching}
            />
          </div>

          {aiSummary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm text-text-secondary">{aiSummary}</p>
              </div>
              <button
                onClick={() => {
                  setUsingAiSearch(false);
                  setRankedResults([]);
                  setAiSummary(null);
                }}
                className="text-xs text-primary hover:underline"
              >
                Show all
              </button>
            </motion.div>
          )}

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full"
                >
                  {filter}
                  <button
                    onClick={() => handleFilterToggle(filter)}
                    className="hover:text-danger transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-warning/10 border border-warning/20 text-warning rounded-2xl p-4 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {searchError}
            </motion.div>
          )}

          <FilterChips activeFilters={activeFilters} onFilterToggle={handleFilterToggle} />

          {status !== "granted" && (
            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                leftIcon={<MapPin className="w-4 h-4" />}
                onClick={detectLocation}
                isLoading={status === "loading"}
              >
                Find Near Me
              </Button>
              {locationError && (
                <p className="text-xs text-text-muted mt-2">{locationError}</p>
              )}
            </div>
          )}

          {useNearby && status === "granted" && (
            <div className="mb-6">
              <div className="bg-primary-50 dark:bg-primary-950 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text">Searching within {filters.maxDistance || 10} km</p>
                  <p className="text-xs text-text-muted mt-1">Sorted by distance from your location</p>
                </div>
                <div className="flex gap-2">
                  {[2, 5, 10, 25].map((km) => (
                    <Button
                      key={km}
                      variant={filters.maxDistance === km ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setFilters((prev) => ({ ...prev, maxDistance: km }))}
                    >
                      {km} km
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
                <SearchFiltersPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  onSearch={() => {}}
                  onClear={handleClear}
                />
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-text-secondary">
                  {aiSummary || `Showing <span className="font-semibold text-text">${paginatedWorkers.length}</span> of <span className="font-semibold text-text">${displayWorkers.length}</span> workers`}
                </p>
                {filters.keyword && (
                  <button
                    onClick={() => setFilters({ ...filters, keyword: undefined })}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Clear search <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <WorkerCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedWorkers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700"
                >
                  <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-text mb-2">No workers found</h3>
                  <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    {aiSummary || "No workers found matching your criteria."}
                  </p>

                  {noResultSuggestions.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-text mb-3">Try:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {noResultSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              if (suggestion.startsWith("Expand")) {
                                const match = suggestion.match(/Expand to (\d+) km/);
                                if (match) {
                                  setFilters((prev) => ({ ...prev, maxDistance: parseInt(match[1]) }));
                                }
                              } else if (suggestion === "Try another service" || suggestion === "Try selecting a specific city") {
                                handleClear();
                              } else {
                                setSearchQuery(suggestion);
                                performAiSearch(suggestion);
                              }
                            }}
                            className="px-4 py-2 bg-primary-50 dark:bg-primary-950 text-primary text-sm font-medium rounded-xl hover:bg-primary/10 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" onClick={handleClear}>
                    Clear Filters
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedWorkers.map((worker, index) => {
                      const isBestMatch = usingAiSearch && rankedResults.length > 0 && rankedResults[0]?.worker?.id === worker.id;
                      return (
                        <div key={worker.id} className="relative">
                          {isBestMatch && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-warning to-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" />
                              Best Match
                            </motion.div>
                          )}
                          <SearchWorkerCard worker={worker} index={index} />
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="mt-8 text-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setCurrentPage((prev) => prev + 1);
                          setLoadingMore(true);
                          setTimeout(() => setLoadingMore(false), 500);
                        }}
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
        </div>
      </div>
      <Footer />
    </main>
  );
}
