"use client";

import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import SearchFiltersPanel from "@/components/search/SearchFilters";
import WorkerCard from "@/components/workers/WorkerCard";
import FilterChips from "@/components/search/FilterChips";
import AiAssistantPanel from "@/components/search/AiAssistantPanel";
import { searchWorkers, mapWorkerDocsToProfiles, searchNearbyWorkers } from "@/services/firestoreService";
import { RankedWorker, searchWorkersWithAI } from "@/services/aiSearchService";
import { ExtractedIntent, ClarificationOption, SessionContext } from "@/lib/ai/types";
import { WorkerCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { SearchFilters, WorkerProfile } from "@/types";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Loader2, X, Star, MapPin, AlertCircle, TrendingUp } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
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
    const cat = filters.category.toLowerCase();
    filtered = filtered.filter(
      (w) => w.categorySlug.toLowerCase() === cat || w.category.toLowerCase() === cat
    );
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
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "distance": {
        const distA = parseFloat(a.distance) || Infinity;
        const distB = parseFloat(b.distance) || Infinity;
        return distA - distB;
      }
      case "price":
        return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      case "experience":
        return (b.experience || 0) - (a.experience || 0);
      case "newest": {
        const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
        const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
        return dateB - dateA || b.id.localeCompare(a.id);
      }
      default:
        return 0;
    }
  });

  return filtered;
}

const PAGE_SIZE = 12;

export default function SearchPage() {
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

  // Multi-turn Conversational AI Assistant State
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [aiIntent, setAiIntent] = useState<ExtractedIntent | null>(null);
  const [aiReplyMessage, setAiReplyMessage] = useState<string | null>(null);
  const [clarificationOptions, setClarificationOptions] = useState<ClarificationOption[] | null>(null);

  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const isFetchingRef = useRef(false);

  const locLatitude = location?.latitude;
  const locLongitude = location?.longitude;

  const fetchWorkers = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setSearchError(null);
    cursorRef.current = null;

    try {
      if (useNearby && locLatitude !== undefined && locLongitude !== undefined) {
        const radius = filters.maxDistance || 10;

        const { workers, error } = await searchNearbyWorkers({
          latitude: locLatitude,
          longitude: locLongitude,
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
            mapWorkerDocsToProfiles([w], { latitude: locLatitude, longitude: locLongitude })[0]
          );
          setAllWorkers(profiles);
        } else {
          setAllWorkers([]);
          if (error) setSearchError(error);
        }
        return;
      }

      const { workers, lastDoc, error } = await searchWorkers({
        limit: 100,
        sortBy: filters.sortBy || "rating",
        verifiedOnly: filters.verifiedOnly,
        category: filters.category,
        minRating: filters.minRating,
        isAvailable: filters.availability,
      });

      if (!error && workers.length > 0) {
        const profiles = mapWorkerDocsToProfiles(workers);
        setAllWorkers(profiles);
        cursorRef.current = lastDoc;
      } else {
        setAllWorkers([]);
        if (error) setSearchError(error);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    useNearby,
    locLatitude,
    locLongitude,
    filters.category,
    filters.sortBy,
    filters.minRating,
    filters.maxDistance,
    filters.verifiedOnly,
    filters.availability,
  ]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) {
        await fetchWorkers();
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [fetchWorkers]);

  const performAiSearch = useCallback(async (query: string, contextOverride?: SessionContext) => {
    if (!query.trim()) return;

    setIsAiSearching(true);
    setSearchError(null);
    setAiSummary(null);
    setNoResultSuggestions([]);

    const currentContext = contextOverride || sessionContext;
    const userLocationContext = {
      latitude: location?.latitude,
      longitude: location?.longitude,
      city: location?.city || location?.area,
    };

    try {
      const result = await searchWorkersWithAI(query, currentContext, userLocationContext);

      setAiIntent(result.intent);
      setAiReplyMessage(result.replyMessage);

      if (result.clarificationNeeded) {
        setClarificationOptions(result.clarificationOptions || []);
        setIsAiSearching(false);
        return;
      }

      setClarificationOptions(null);
      setRankedResults(result.workers.map((w) => ({ worker: w, score: 0 })));
      setUsingAiSearch(true);
      setAiSummary(result.replyMessage);

      // Multi-turn context update
      const updatedContext: SessionContext = {
        lastCategory: result.intent.canonicalCategory || undefined,
        lastLocation: result.intent.extractedEntities.location || undefined,
        lastUrgency: result.intent.extractedEntities.urgency || undefined,
        lastBudget: result.intent.extractedEntities.budget || undefined,
        language: result.intent.detectedLanguage,
      };
      setSessionContext(updatedContext);

      // Sync manual filters so the user can easily review or adjust them
      if (result.intent.canonicalCategory) {
        setFilters((prev) => ({ ...prev, category: result.intent.canonicalCategory! }));
      }
      if (result.intent.extractedEntities.location) {
        setFilters((prev) => ({ ...prev, location: result.intent.extractedEntities.location! }));
      }
      if (result.intent.extractedEntities.urgency === "immediate") {
        setFilters((prev) => ({ ...prev, availability: true }));
      }
      if (result.intent.extractedEntities.budget) {
        setFilters((prev) => ({ ...prev, priceRange: [0, result.intent.extractedEntities.budget!] }));
      }

      if (result.workers.length === 0) {
        setNoResultSuggestions([
          "Aas-paas ke shahar ya ilaaqe me dekhein",
          "Kripya budget thoda badha kar dekhein",
          "Manual filters se sabhi karigar dekhein",
        ]);
      }

      if (!searchHistory.includes(query)) {
        const newHistory = [query, ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
        localStorage.setItem("kaamwalaSearchHistory", JSON.stringify(newHistory));

        if (user?.uid) {
          persistSearchToFirestore(user.uid, query, result.workers.length).catch(() => {});
        }
      }

      trackSearchEvent({
        event: "search_completed",
        query,
        resultCount: result.workers.length,
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
  }, [location, sessionContext, searchHistory, user]);

  const handleSelectClarification = (opt: ClarificationOption) => {
    const updatedContext: SessionContext = {
      ...sessionContext,
      lastCategory: opt.category,
    };
    setSessionContext(updatedContext);
    const updatedQuery = `${searchQuery ? searchQuery + " " : ""}${opt.label}`;
    setSearchQuery(updatedQuery);
    void performAiSearch(updatedQuery, updatedContext);
  };

  const handleClearEntity = (entityKey: "service" | "location" | "urgency" | "budget") => {
    setSessionContext((prev) => {
      const next = { ...prev };
      if (entityKey === "service") next.lastCategory = undefined;
      if (entityKey === "location") next.lastLocation = undefined;
      if (entityKey === "urgency") next.lastUrgency = undefined;
      if (entityKey === "budget") next.lastBudget = undefined;
      return next;
    });
    if (aiIntent) {
      setAiIntent((prev) => {
        if (!prev) return null;
        const nextEntities = { ...prev.extractedEntities };
        if (entityKey === "service") {
          nextEntities.service = null;
        } else if (entityKey === "location") {
          nextEntities.location = null;
          nextEntities.coordinates = undefined;
        } else if (entityKey === "urgency") {
          nextEntities.urgency = "flexible";
        } else if (entityKey === "budget") {
          nextEntities.budget = null;
        }
        return {
          ...prev,
          canonicalCategory: entityKey === "service" ? null : prev.canonicalCategory,
          extractedEntities: nextEntities,
        };
      });
    }
  };

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
    setAiIntent(null);
    setAiReplyMessage(null);
    setClarificationOptions(null);
    setSessionContext({});
    setNoResultSuggestions([]);
    setSearchError(null);
  };

  const filteredWorkers = useMemo(() => filterWorkers(allWorkers, filters), [allWorkers, filters]);

  const displayWorkers = usingAiSearch
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
    setAiIntent(null);
    setAiReplyMessage(null);
    setClarificationOptions(null);
    setSessionContext({});
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
              onSearch={(q, ctx) => {
                setSearchQuery(q);
                void performAiSearch(q, ctx);
              }}
              onClear={handleClearSearch}
              isSearching={isAiSearching}
              extractedIntent={aiIntent}
              replyMessage={aiReplyMessage}
              clarificationOptions={clarificationOptions}
              onSelectClarification={handleSelectClarification}
              onClearEntity={handleClearEntity}
              userCity={location?.city || location?.area}
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
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 max-w-xl mx-auto"
                >
                  <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-text mb-2">Koi worker uplabdh nahi hai</h3>
                  <p className="text-text-secondary mb-6 max-w-md mx-auto">
                    {aiSummary || "No workers found matching your criteria. Try adjusting your filters or search terms."}
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
                          <WorkerCard worker={worker} index={index} />
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
