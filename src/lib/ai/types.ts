import type { WorkerProfile } from "@/types";

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
  extractIntent(query: string, context?: { location?: { latitude: number; longitude: number }; userRole?: string }): Promise<SearchIntent>;
  rankWorkers(workers: WorkerProfile[], intent: SearchIntent): Promise<WorkerProfile[]>;
  generateSummary(intent: SearchIntent, resultCount: number): Promise<string>;
  getNoResultSuggestions(intent: SearchIntent): Promise<string[]>;
}

export { parseNaturalLanguage } from "./fallback";
