"use client";

import { WorkerProfile } from "@/types";

export interface ParsedQuery {
  category: string | null;
  skill: string | null;
  timePreference: string | null;
  location: string | null;
  keywords: string[];
}

const PROFESSION_KEYWORDS: Record<string, string[]> = {
  Electrician: ["electrician", "electric", "wiring", "ac", "ac repair", "fan", "light", "mcb", "socket"],
  Plumber: ["plumber", "plumbing", "water", "leak", "pipe", "bathroom", "tap", "flush", "blockage"],
  Carpenter: ["carpenter", "carpentry", "wood", "furniture", "cabinet", "door", "window", "shelf"],
  Painter: ["painter", "paint", "wall", "color", "repaint", "interior", "exterior", "emulsion"],
  Welder: ["welder", "weld", "metal", "steel", "grill", "gate", "fabrication"],
  Mason: ["mason", "masonry", "brick", "concrete", "foundation", "wall", "construction"],
  Driver: ["driver", "driving", "license", "vehicle", "delivery", "transport"],
  "House Cleaner": ["cleaner", "cleaning", "housekeeping", "sweep", "mop", "dust", "vacuuming"],
  "AC Repair": ["ac", "air conditioner", "cooling", "not cooling", "gas", "compressor", "ventilation"],
  "Mobile Repair": ["mobile", "phone", "smartphone", "screen", "battery", "charging", "repair"],
  "Computer Repair": ["computer", "laptop", "pc", "software", "hardware", "data", "virus"],
  Gardener: ["gardener", "garden", "plants", "lawn", "grass", "trees", "flowers"],
  Tailor: ["tailor", "sewing", "stitching", "clothes", "alteration", "dress", "fabric"],
};

const TIME_KEYWORDS: Record<string, string[]> = {
  today: ["today", "now", "emergency", "urgent"],
  tomorrow: ["tomorrow", "tomorrow morning", "tomorrow afternoon", "tomorrow evening"],
  morning: ["morning", "7am", "8am", "9am", "10am", "11am", "early"],
  afternoon: ["afternoon", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"],
  evening: ["evening", "6pm", "7pm", "8pm", "9pm", "10pm"],
  weekend: ["weekend", "saturday", "sunday"],
};

const LOCATION_KEYWORDS: Record<string, string[]> = {
  "Gomti Nagar": ["gomti nagar", "gomti"],
  Indiranagar: ["indiranagar"],
  "Lucknow": ["lucknow", "luttar"],
  Noida: ["noida"],
  Delhi: ["delhi", "ncr"],
  Mumbai: ["mumbai", "bombay", "bumbai"],
  Bangalore: ["bangalore", "banglore", "bengaluru"],
};

export function parseNaturalLanguage(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const keywords = lower.split(/\s+/).filter((k) => k.length > 2);

  let category: string | null = null;
  let skill: string | null = null;
  let timePreference: string | null = null;
  let location: string | null = null;

  for (const [prof, kws] of Object.entries(PROFESSION_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        if (!category) {
          category = prof;
        }
        skill = kw;
        break;
      }
    }
  }

  if (!category) {
    for (const [time, kws] of Object.entries(TIME_KEYWORDS)) {
      for (const kw of kws) {
        if (lower.includes(kw)) {
          timePreference = time;
          break;
        }
      }
      if (timePreference) break;
    }
  }

  if (!timePreference) {
    for (const [time, kws] of Object.entries(TIME_KEYWORDS)) {
      for (const kw of kws) {
        if (lower.includes(kw)) {
          timePreference = time;
          break;
        }
      }
      if (timePreference) break;
    }
  }

  for (const [loc, kws] of Object.entries(LOCATION_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        location = loc;
        break;
      }
    }
    if (location) break;
  }

  return { category, skill, timePreference, location, keywords };
}

interface ScoreParams {
  userLat?: number;
  userLng?: number;
  searchKeyword?: string;
}

function scoreWorker(worker: WorkerProfile, params: ScoreParams): number {
  let score = 0;

  if (worker.isVerified) score += 20;
  if (worker.isAvailable) score += 10;
  score += Math.min(worker.rating / 5, 1) * 25;
  score += Math.min(worker.experience / 20, 1) * 15;
  score += Math.min(worker.reviews.length / 50, 1) * 10;
  score += Math.min((worker.portfolioImages?.length ?? 0) / 5, 1) * 10;

  if (params.searchKeyword && worker.category.toLowerCase().includes(params.searchKeyword.toLowerCase())) {
    score += 10;
  }

  if (params.userLat && params.userLng && worker.distance) {
    const distMatch = worker.distance.match(/([\d.]+)/);
    if (distMatch) {
      const dist = parseFloat(distMatch[1]);
      if (dist < 5) score += 10;
      else if (dist < 15) score += 5;
    }
  }

  const profileFields = [
    worker.description?.length > 0,
    worker.skills.length > 0,
    worker.languages.length > 0,
    worker.hourlyRate > 0,
    (worker.portfolioImages?.length ?? 0) > 0,
  ];
  const completeness = (profileFields.filter(Boolean).length / profileFields.length) * 5;
  score += completeness;

  return Math.round(score);
}

export interface RankedWorker {
  worker: WorkerProfile;
  score: number;
}

export function rankWorkers(
  workers: WorkerProfile[],
  params: ScoreParams = {}
): RankedWorker[] {
  return workers
    .map((w) => ({ worker: w, score: scoreWorker(w, params) }))
    .sort((a, b) => b.score - a.score);
}

export function getTopMatches(workers: WorkerProfile[], limit = 3, params: ScoreParams = {}): RankedWorker[] {
  return rankWorkers(workers, params).slice(0, limit);
}

export function calculateProfileScore(worker: WorkerProfile): { score: number; factors: { name: string; value: number }[] } {
  const factors: { name: string; value: number }[] = [];

  const verified = worker.isVerified ? 15 : 0;
  factors.push({ name: "Verification", value: verified });

  const ratingScore = Math.round((worker.rating / 5) * 20);
  factors.push({ name: "Rating", value: ratingScore });

  const expScore = Math.min(Math.round((worker.experience / 20) * 20), 20);
  factors.push({ name: "Experience", value: expScore });

  const portfolioScore = Math.min((worker.portfolioImages?.length ?? 0) * 5, 15);
  factors.push({ name: "Portfolio", value: portfolioScore });

  const reviewsScore = Math.min(worker.reviews.length * 2, 10);
  factors.push({ name: "Reviews", value: reviewsScore });

  let profileFields = 0;
  const totalFields = 6;
  if (worker.name) profileFields++;
  if (worker.category) profileFields++;
  if (worker.description?.length > 0) profileFields++;
  if (worker.skills.length > 0) profileFields++;
  if (worker.languages.length > 0) profileFields++;
  if (worker.hourlyRate > 0) profileFields++;
  const profileScore = Math.round((profileFields / totalFields) * 10);
  factors.push({ name: "Profile", value: profileScore });

  const score = factors.reduce((sum, f) => sum + f.value, 0);
  return { score: Math.min(score, 100), factors };
}

export function rankWorkersByRecency(workers: WorkerProfile[], days = 30): WorkerProfile[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return workers
    .filter((w) => {
      if (!w.joinedDate) return false;
      return new Date(w.joinedDate).getTime() > cutoff;
    })
    .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime());
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export const AI_SUGGESTIONS = [
  "Most booked in your area",
  "Customers also hired",
  "Also consider...",
  "Top picks near you",
  "Recently active workers",
];
