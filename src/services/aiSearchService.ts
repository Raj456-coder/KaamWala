"use client";

import { WorkerProfile } from "@/types";
import { ExtractedIntent, ClarificationOption, SessionContext } from "@/lib/ai/types";
import { extractIntent } from "@/lib/ai/intentExtractor";
import { searchNearbyWorkers, searchWorkers, mapWorkerDocsToProfiles } from "@/services/firestoreService";
import { Coordinates, getCityCoordinates } from "@/lib/location";

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

export interface AISearchResult {
  workers: WorkerProfile[];
  intent: ExtractedIntent;
  replyMessage: string;
  clarificationNeeded: boolean;
  clarificationOptions?: ClarificationOption[];
  totalMatches: number;
}

export async function searchWorkersWithAI(
  query: string,
  sessionContext?: SessionContext,
  userLocationContext?: {
    latitude?: number;
    longitude?: number;
    city?: string;
  }
): Promise<AISearchResult> {
  let intent: ExtractedIntent;

  try {
    const res = await fetch("/api/ai/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        context: sessionContext,
        userLocation: userLocationContext,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      intent = data.intent;
    } else {
      intent = extractIntent(query, sessionContext);
    }
  } catch {
    intent = extractIntent(query, sessionContext);
  }

  // Ambiguity clarification check
  if (intent.intent === "clarification_needed" || intent.clarificationNeeded) {
    return {
      workers: [],
      intent,
      replyMessage: intent.replyMessage || "Kripya batayein aapko kis tarah ki service chahiye?",
      clarificationNeeded: true,
      clarificationOptions: intent.clarificationOptions || [],
      totalMatches: 0,
    };
  }

  // Location resolution
  let coords: Coordinates | null = intent.extractedEntities.coordinates || null;
  const searchCity = intent.extractedEntities.location || userLocationContext?.city;

  if (!coords && searchCity) {
    coords = getCityCoordinates(searchCity);
  }
  if (!coords && userLocationContext?.latitude && userLocationContext?.longitude) {
    coords = {
      latitude: userLocationContext.latitude,
      longitude: userLocationContext.longitude,
    };
  }

  const category = intent.canonicalCategory || undefined;
  const isAvailableOnly = intent.extractedEntities.urgency === "immediate";
  const budget = intent.extractedEntities.budget;

  let profiles: WorkerProfile[] = [];

  // 1. Try geo search if coordinates available
  if (coords) {
    const { workers, error } = await searchNearbyWorkers({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusKm: 35,
      category,
      isAvailable: isAvailableOnly ? true : undefined,
      limit: 60,
    });

    if (!error && workers.length > 0) {
      profiles = mapWorkerDocsToProfiles(workers, coords);
    }
  }

  // 2. Fallback to standard category search if geo search returned 0 or no coords
  if (profiles.length === 0) {
    const { workers } = await searchWorkers({
      category,
      isAvailable: isAvailableOnly ? true : undefined,
      limit: 60,
    });
    if (workers && workers.length > 0) {
      profiles = mapWorkerDocsToProfiles(workers, coords || undefined);
    }
  }

  // 3. Filter by city if city was specified and coordinates didn't already constrain it
  if (searchCity && profiles.length > 0) {
    const cityNorm = searchCity.toLowerCase();
    const cityFiltered = profiles.filter((p) => {
      const wCity = (p.location || "").toLowerCase();
      return wCity.includes(cityNorm) || cityNorm.includes(wCity);
    });
    // If exact city matches exist, use them
    if (cityFiltered.length > 0) {
      profiles = cityFiltered;
    }
  }

  // 4. Rank workers
  profiles.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Budget matching
    if (budget) {
      if (a.hourlyRate > 0 && a.hourlyRate <= budget) scoreA += 30;
      if (b.hourlyRate > 0 && b.hourlyRate <= budget) scoreB += 30;
    }

    // Availability
    if (a.isAvailable) scoreA += 20;
    if (b.isAvailable) scoreB += 20;

    // Rating & Experience
    scoreA += (a.rating || 0) * 10;
    scoreB += (b.rating || 0) * 10;
    scoreA += Math.min(a.experience || 0, 15) * 2;
    scoreB += Math.min(b.experience || 0, 15) * 2;

    // Verified
    if (a.isVerified) scoreA += 15;
    if (b.isVerified) scoreB += 15;

    // Distance if present
    if (a.distance && b.distance) {
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      if (!isNaN(distA) && !isNaN(distB)) {
        scoreA += Math.max(0, 30 - distA);
        scoreB += Math.max(0, 30 - distB);
      }
    }

    return scoreB - scoreA;
  });

  // Compose dynamic natural reply message
  let replyMessage = intent.replyMessage;
  const count = profiles.length;
  const serviceName = intent.serviceName || "service";
  const locDisplay = searchCity || "aapke ilaqe";

  if (count > 0) {
    if (intent.detectedLanguage === "hi") {
      replyMessage = `हमे ${locDisplay} में ${count} सत्यापित ${serviceName} मिले हैं। सबसे बेहतरीन विकल्प नीचे दिखाए गए हैं।`;
    } else if (intent.detectedLanguage === "hinglish") {
      replyMessage = `Humein ${locDisplay} me ${count} verified ${serviceName}s mile hain. Sabse kareeb aur top-rated workers neeche hain.`;
    } else {
      replyMessage = `Found ${count} verified ${serviceName}(s) in ${locDisplay}. Top available workers are listed below.`;
    }
  } else {
    if (intent.detectedLanguage === "hi") {
      replyMessage = `माफ़ कीजिए, ${locDisplay} में अभी कोई ${serviceName} उपलब्ध नहीं है। कृपया कोई अन्य लोकेशन या सर्विस देखें।`;
    } else if (intent.detectedLanguage === "hinglish") {
      replyMessage = `Maaf kijiye, ${locDisplay} me abhi koi verified ${serviceName} uplabdh nahi hai. Kripya doosri location chunein ya manual filters use karein.`;
    } else {
      replyMessage = `Sorry, no verified ${serviceName} found in ${locDisplay} right now. Please try nearby areas or adjust filters.`;
    }
  }

  return {
    workers: profiles,
    intent,
    replyMessage,
    clarificationNeeded: false,
    totalMatches: profiles.length,
  };
}

