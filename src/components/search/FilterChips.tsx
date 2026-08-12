"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Award, IndianRupee, Clock, Briefcase, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  activeFilters: string[];
  onFilterToggle: (filter: string) => void;
}

const CHIPS = [
  { id: "available", label: "Available Today", icon: Clock },
  { id: "verified", label: "Verified", icon: CheckCircle2 },
  { id: "topRated", label: "Top Rated", icon: Award },
  { id: "budget", label: "Budget Friendly", icon: IndianRupee },
  { id: "nearest", label: "Nearest", icon: MapPin },
  { id: "nearby", label: "Near Me", icon: Navigation },
  { id: "experienced", label: "Highly Experienced", icon: Briefcase },
];

export default function FilterChips({ activeFilters, onFilterToggle }: FilterChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-2 mb-6"
    >
      {CHIPS.map((chip) => {
        const isActive = activeFilters.includes(chip.id);
        return (
          <motion.button
            key={chip.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterToggle(chip.id)}
            className={cn(
              "px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all duration-200",
              isActive
                ? "bg-primary-50 dark:bg-primary-950 border-primary text-primary"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-text-muted hover:text-text hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            <chip.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-muted")} />
            {chip.label}
            {isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
