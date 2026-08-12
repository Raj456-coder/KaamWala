"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Clock, Search } from "lucide-react";
import { parseNaturalLanguage, AI_SUGGESTIONS, ParsedQuery } from "@/services/aiSearchService";

interface AiSearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
}

const TRENDING_SERVICES = ["Electrician", "Plumber", "AC Repair", "House Cleaner", "Painter", "Carpenter"];

export default function AiSearchSuggestions({ query, onSuggestionClick }: AiSearchSuggestionsProps) {
  const parsed: ParsedQuery | null = query.length > 3 ? parseNaturalLanguage(query) : null;

  const hasMeaningfulQuery = query.length > 2;

  if (!hasMeaningfulQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
          <Clock className="w-4 h-4" />
          <span>Trending Services</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_SERVICES.map((service, index) => (
            <motion.button
              key={service}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSuggestionClick(service)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-text hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-primary" />
              {service}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      {parsed && (parsed.category || parsed.skill || parsed.timePreference || parsed.location) && (
        <div className="bg-surface dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-text">AI Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsed.category && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Service:</span>
                <span className="font-medium text-text">{parsed.category}</span>
              </div>
            )}
            {parsed.skill && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Skill:</span>
                <span className="font-medium text-text">{parsed.skill}</span>
              </div>
            )}
            {parsed.timePreference && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Time:</span>
                <span className="font-medium text-text">{parsed.timePreference}</span>
              </div>
            )}
            {parsed.location && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Location:</span>
                <span className="font-medium text-text">{parsed.location}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
        <Search className="w-4 h-4" />
        <span>Suggestions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {AI_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-text-muted hover:text-text hover:border-primary/30 transition-colors"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
