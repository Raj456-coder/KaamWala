import type { WorkerProfile } from "@/types";
import { SearchIntent, AIProvider } from "./types";
import { parseNaturalLanguage } from "./fallback";

export class DeterministicAIProvider implements AIProvider {
  async extractIntent(query: string): Promise<SearchIntent> {
    return parseNaturalLanguage(query);
  }

  rankWorkers(workers: WorkerProfile[], intent: SearchIntent): Promise<WorkerProfile[]> {
    const ranked = [...workers];

    ranked.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (intent.service) {
        const serviceLower = intent.service.toLowerCase();
        if (a.category.toLowerCase().includes(serviceLower)) scoreA += 100;
        if (b.category.toLowerCase().includes(serviceLower)) scoreB += 100;
      }

      if (intent.urgency === "today" || intent.availability === "today") {
        if (a.isAvailable) scoreA += 50;
        if (b.isAvailable) scoreB += 50;
      }

      scoreA += (a.rating || 0) * 5;
      scoreB += (b.rating || 0) * 5;

      scoreA += Math.min(a.experience || 0, 20) * 2;
      scoreB += Math.min(b.experience || 0, 20) * 2;

      if (intent.pricePreference === "budget") {
        scoreA += Math.max(0, 100 - (a.hourlyRate || 0));
        scoreB += Math.max(0, 100 - (b.hourlyRate || 0));
      } else if (intent.pricePreference === "premium") {
        scoreA += (a.hourlyRate || 0) / 10;
        scoreB += (b.hourlyRate || 0) / 10;
      }

      if (a.isVerified) scoreA += 20;
      if (b.isVerified) scoreB += 20;

      return scoreB - scoreA;
    });

    return Promise.resolve(ranked);
  }

  generateSummary(intent: SearchIntent, resultCount: number): Promise<string> {
    const parts: string[] = [];

    if (intent.service) {
      parts.push(`${intent.service}s`);
    } else {
      parts.push("workers");
    }

    if (intent.location === "current") {
      parts.push("near you");
    } else if (intent.location) {
      parts.push(`in ${intent.location}`);
    }

    if (intent.radiusKm) {
      parts.push(`within ${intent.radiusKm} km`);
    }

    if (intent.availability === "today") {
      parts.push("available today");
    }

    return Promise.resolve(`Found ${resultCount} ${parts.join(" ")}`);
  }

  getNoResultSuggestions(intent: SearchIntent): Promise<string[]> {
    const suggestions: string[] = [];

    if (intent.radiusKm && intent.radiusKm <= 10) {
      suggestions.push(`Expand to ${Math.min(intent.radiusKm * 2, 25)} km`);
    }

    if (intent.service) {
      const related: Record<string, string[]> = {
        "AC Repair": ["Electrician", "Appliance Repair"],
        Electrician: ["AC Repair", "Home Automation"],
        Plumber: ["Water Purifier Service"],
        Carpenter: ["Furniture Repair", "Painter"],
        Painter: ["Carpenter", "Wallpaper Installer"],
      };
      const relatedServices = related[intent.service] || [];
      suggestions.push(...relatedServices.slice(0, 2));
    }

    if (!intent.location || intent.location === "current") {
      suggestions.push("Try selecting a specific city");
    }

    suggestions.push("Try another service");

    return Promise.resolve(suggestions.slice(0, 4));
  }
}

export const defaultAIProvider: AIProvider = new DeterministicAIProvider();
