"use client";

import { motion } from "framer-motion";
import { Search, MapPin, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { CATEGORIES } from "@/constants";
import { SearchFilters } from "@/types";
import { cn } from "@/lib/utils";

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  className?: string;
}

export default function SearchFiltersPanel({ filters, onFilterChange, onSearch, onClear, className }: SearchFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn("bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm", className)}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-text">Filters</h3>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <ChevronDown className={cn("w-5 h-5 text-text-secondary transition-transform", !isExpanded && "-rotate-180")} />
        </button>
      </div>

      <motion.div animate={{ height: isExpanded ? "auto" : 0 }} className="overflow-hidden">
        <div className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Category</label>
            <select
              value={filters.category || ""}
              onChange={(e) => updateFilter("category", e.target.value || undefined)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Enter city or area"
                value={filters.location || ""}
                onChange={(e) => updateFilter("location", e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text placeholder:text-text-muted"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by skill or name"
                value={filters.keyword || ""}
                onChange={(e) => updateFilter("keyword", e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text placeholder:text-text-muted"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Minimum Rating</label>
            <div className="flex items-center gap-2">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateFilter("minRating", filters.minRating === rating ? undefined : rating)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all border",
                    filters.minRating === rating
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-50 dark:bg-slate-900 text-text-secondary border-slate-200 dark:border-slate-700 hover:border-primary/50"
                  )}
                >
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Availability</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availability || false}
                onChange={(e) => updateFilter("availability", e.target.checked || undefined)}
                className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/40"
              />
              <span className="text-sm text-text">Available Now</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verifiedOnly || false}
                onChange={(e) => updateFilter("verifiedOnly", e.target.checked || undefined)}
                className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/40"
              />
              <span className="text-sm text-text">Verified Only</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Experience (years)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.experience?.[0] ?? ""}
                  onChange={(e) => updateFilter("experience", [parseInt(e.target.value) || 0, filters.experience?.[1] ?? 50])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text placeholder:text-text-muted"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.experience?.[1] ?? ""}
                  onChange={(e) => updateFilter("experience", [filters.experience?.[0] ?? 0, parseInt(e.target.value) || 50])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Price Range (₹/hr)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.priceRange?.[0] ?? ""}
                  onChange={(e) => updateFilter("priceRange", [parseInt(e.target.value) || 0, filters.priceRange?.[1] ?? 9999])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text placeholder:text-text-muted"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.priceRange?.[1] ?? ""}
                  onChange={(e) => updateFilter("priceRange", [filters.priceRange?.[0] ?? 0, parseInt(e.target.value) || 9999])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm text-text placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Sort By</label>
            <select
              value={filters.sortBy || "rating"}
              onChange={(e) => updateFilter("sortBy", e.target.value as SearchFilters["sortBy"])}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-text appearance-none cursor-pointer"
            >
              <option value="rating">Highest Rated</option>
              <option value="distance">Nearest</option>
              <option value="price">Lowest Price</option>
              <option value="experience">Most Experienced</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={onSearch}>Apply Filters</Button>
            <Button variant="ghost" onClick={onClear} className="flex items-center gap-1">
              <X className="w-4 h-4" /> Clear
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
