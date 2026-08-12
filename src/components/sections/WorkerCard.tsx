"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Phone, MessageCircle, CheckCircle2, Lock } from "lucide-react";
import { WorkerProfile } from "@/types";
import { ContactUnlockWithId } from "@/types/monetization";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import ContactUnlockButton from "@/components/monetization/ContactUnlockButton";

interface WorkerCardProps {
  worker: WorkerProfile;
  index?: number;
  unlock?: ContactUnlockWithId | null;
  onUnlockRequest?: () => void;
  unlockLoading?: boolean;
}

export default function WorkerCard({ worker, index = 0, unlock, onUnlockRequest, unlockLoading }: WorkerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-xl font-bold">
              {worker.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            {worker.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text truncate">
                {worker.name}
              </h3>
              {worker.isVerified && (
                <Badge variant="success" size="sm">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-primary font-medium mb-2">
              {worker.category}
            </p>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-medium text-text">
                  {worker.rating}
                </span>
                <span>({worker.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{worker.distance}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {worker.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm text-text-secondary line-clamp-2">
          {worker.description}
        </p>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-xs text-text-muted">Experience</p>
            <p className="font-semibold text-text">{worker.experience} yrs</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Hourly Rate</p>
            <p className="font-bold text-primary text-lg">
              {formatCurrency(worker.hourlyRate)}<span className="text-sm font-normal text-text-muted">/hr</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <ContactUnlockButton
            workerId={worker.id}
            workerName={worker.name}
            phoneNumber={worker.phoneNumber}
            unlock={unlock || null}
            onUnlockRequest={onUnlockRequest}
            loading={unlockLoading}
          />
          <div className="flex gap-2">
            <Link href={`/workers/${worker.id}`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">View Profile</Button>
            </Link>
          </div>
        </div>

        {!worker.isAvailable && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="warning" size="md">Currently Busy</Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
}
