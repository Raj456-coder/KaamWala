"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone, MessageCircle, CheckCircle2, Languages, Heart } from "lucide-react";
import { WorkerProfile } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { saveWorker, removeSavedWorker } from "@/services/firestoreService";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchWorkerCardProps {
  worker: WorkerProfile;
  index?: number;
  onViewProfile?: (id: string) => void;
}

export default function SearchWorkerCard({ worker, index = 0, onViewProfile }: SearchWorkerCardProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await removeSavedWorker(user.uid, worker.id);
        setIsSaved(false);
      } else {
        await saveWorker(user.uid, worker.id);
        setIsSaved(true);
      }
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
    >
      <div className="relative p-6">
        {!worker.isAvailable && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Badge variant="warning" size="md">Currently Busy</Badge>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold overflow-hidden">
              {worker.name.split(" ").map((n) => n[0]).join("")}
            </div>
            {worker.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text truncate">{worker.name}</h3>
              {worker.isVerified && <Badge variant="success" size="sm">Verified</Badge>}
            </div>
            <p className="text-sm text-primary font-medium mb-2">{worker.category}</p>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-medium text-text">{worker.rating}</span>
                <span>({worker.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{worker.distance}</span>
              </div>
            </div>
          </div>

          {user && (
            <button
              onClick={handleToggleSave}
              disabled={isSaving}
              className={cn(
                "p-2 rounded-full transition-colors",
                isSaved
                  ? "text-danger bg-danger/10"
                  : "text-text-muted hover:text-danger hover:bg-danger/5"
              )}
              aria-label={isSaved ? "Remove from saved" : "Save worker"}
            >
              <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {worker.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{worker.experience} yrs exp</span>
          </div>
          <div className="flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" />
            <span>{worker.languages.slice(0, 2).join(", ")}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-xs text-text-muted">Starting Price</p>
            <p className="font-bold text-primary text-lg">
              {formatCurrency(worker.hourlyRate)}<span className="text-sm font-normal text-text-muted">/hr</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Location</p>
            <p className="font-medium text-text text-sm line-clamp-1">{worker.location}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Phone className="w-4 h-4" />}>
            Call
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" leftIcon={<MessageCircle className="w-4 h-4" />}>
            WhatsApp
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onViewProfile?.(worker.id)}>
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
