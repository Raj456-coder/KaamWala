import type { WorkerProfile } from "@/types";
import { Coordinates } from "@/lib/location";

export interface ClarificationOption {
  label: string;
  value: string;
  category: string;
  service: string;
  displayName: string;
}

export interface ExtractedEntities {
  service: string | null;
  location: string | null;
  date: string | null;
  time: string | null;
  urgency: "immediate" | "today" | "flexible";
  budget: number | null;
  coordinates?: Coordinates;
}

export interface ExtractedIntent {
  intent: "find_worker" | "worker_search" | "clarification_needed" | "greeting" | "help" | "service_inquiry" | "unknown";
  canonicalCategory: string | null;
  service?: string;
  serviceName?: string;
  serviceAliases?: string[];
  detectedLanguage: "hi" | "en" | "hinglish";
  language: "hi" | "en" | "hinglish";
  confidence: number;
  rawQuery: string;
  extractedEntities: ExtractedEntities;
  location?: string;
  date?: string;
  time?: string;
  budget?: number;
  availability?: "now" | "today" | "any";
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: ClarificationOption[];
  clarification?: {
    question: string;
    options: ClarificationOption[];
  };
  replyMessage: string;
  naturalResponse: string;
}

export interface SessionContext {
  previousIntent?: ExtractedIntent;
  lastCategory?: string;
  lastLocation?: string;
  lastUrgency?: "immediate" | "today" | "flexible";
  lastBudget?: number;
  language?: "hi" | "en" | "hinglish";
  userLocation?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  };
}

export interface SearchIntent {
  service: string | undefined;
  location: string | undefined;
  radiusKm: number | undefined;
  availability: string | undefined;
  urgency: string | undefined;
  experience: string | undefined;
  pricePreference: string | undefined;
  rawQuery: string;
  keywords: string[];
}

export interface SearchResult {
  workers: WorkerProfile[];
  summary: string;
  suggestions: string[];
  filters: string[];
}

export interface AIProvider {
  extractIntent(
    query: string,
    context?: { location?: { latitude: number; longitude: number }; userRole?: string }
  ): Promise<SearchIntent>;
  rankWorkers(workers: WorkerProfile[], intent: SearchIntent): Promise<WorkerProfile[]>;
  generateSummary(intent: SearchIntent, resultCount: number): Promise<string>;
  getNoResultSuggestions(intent: SearchIntent): Promise<string[]>;
}

export { parseNaturalLanguage } from "./fallback";
