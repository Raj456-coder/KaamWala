import { SERVICE_TAXONOMY, AMBIGUITY_RULES, TIME_TERMS } from "./taxonomy";
import { ExtractedIntent, SessionContext, ClarificationOption, ExtractedEntities } from "./types";

const HINDI_DEVANAGARI_REGEX = /[\u0900-\u097F]/;

const HINGLISH_MARKERS = [
  "chahiye", "chaheye", "chahie", "hai", "hain", "karna", "karwana", "karwani",
  "mujhe", "humko", "hume", "mera", "mere", "meri", "ghar", "kaam", "wala", "wali",
  "wale", "ke liye", "keliye", "ho raha", "ho rahi", "bhej do", "bhejo", "dekh",
  "dekho", "karo", "kisi", "aur", "koi", "milega", "mil", "sakta", "ab", "abhi",
  "turant", "aaj", "kal", "subah", "shaam", "dopahar", "raat", "paas", "andar", "mein", "me"
];

const KNOWN_CITIES = [
  "mathura", "vrindavan", "agra", "lucknow", "noida", "delhi", "new delhi", "gurgaon", "gurugram",
  "ghaziabad", "faridabad", "kanpur", "varanasi", "jaipur", "mumbai",
  "pune", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata",
  "chandigarh", "indore", "bhopal", "patna", "prayagraj", "allahabad", "meerut", "aligarh"
];

export function detectLanguage(text: string): "hi" | "en" | "hinglish" {
  if (HINDI_DEVANAGARI_REGEX.test(text)) {
    return "hi";
  }
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const hinglishCount = words.filter((w) => HINGLISH_MARKERS.includes(w)).length;
  if (hinglishCount > 0 || /\b(chahiye|wala|wali|hai|mujhe|ghar|ke liye|andar|turant|bula)\b/i.test(lower)) {
    return "hinglish";
  }
  return "en";
}

export function extractBudget(text: string): number | undefined {
  const lower = text.toLowerCase();
  const budgetPatterns = [
    /(?:rs\.?|inr|₹)?\s*(\d{2,6})\s*(?:rupaye|rs|inr|₹)?\s*(?:ke\s*andar|tak|se\s*kam|under|max|budget)/i,
    /(?:under|below|less\s*than|max|budget)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})/i,
    /(\d{2,6})\s*(?:ke\s*andar)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > 0 && val < 100000) {
        return val;
      }
    }
  }
  return undefined;
}

export function extractLocation(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Pattern: "<City> me / mein / main" (e.g. "Mathura me", "Agra mein")
  const hindiLocMatch = lower.match(/(?:in|near|at)?\s*([a-z\s]+?)\s+(?:me|mein|main)\b/i);
  if (hindiLocMatch && hindiLocMatch[1]) {
    const candidate = hindiLocMatch[1].trim().split(/\s+/).pop();
    if (candidate && candidate.length > 2 && !HINGLISH_MARKERS.includes(candidate)) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  // Pattern: "in <City>" or "near <City>"
  const engLocMatch = lower.match(/\b(?:in|near|around|at)\s+([a-z]+)\b/i);
  if (engLocMatch && engLocMatch[1]) {
    const candidate = engLocMatch[1].trim().toLowerCase();
    if (candidate.length > 2 && !HINGLISH_MARKERS.includes(candidate)) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  // Check known cities list
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(lower)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  return undefined;
}

export function extractTimeAndUrgency(text: string): {
  date?: "today" | "tomorrow" | string;
  time?: "morning" | "afternoon" | "evening" | "now" | string;
  urgency: "immediate" | "today" | "flexible";
  availability?: "now" | "today" | "any";
} {
  const lower = text.toLowerCase();
  let date: "today" | "tomorrow" | string | undefined;
  let time: "morning" | "afternoon" | "evening" | "now" | string | undefined;
  let availability: "now" | "today" | "any" | undefined;
  let urgency: "immediate" | "today" | "flexible" = "flexible";

  // Check for immediate urgency markers
  if (/\b(urgent|emergency|turant|abhi|immediately|asap|aaj hi|right now)\b/i.test(lower)) {
    urgency = "immediate";
    availability = "now";
    time = "now";
    date = "today";
  } else if (/\b(aaj|today)\b/i.test(lower)) {
    urgency = "today";
    availability = "today";
    date = "today";
  }

  for (const [term, data] of Object.entries(TIME_TERMS)) {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(lower)) {
      if (data.date && !date) date = data.date;
      if (data.time && !time) time = data.time;
      if (data.availability === "now") {
        urgency = "immediate";
        availability = "now";
      } else if (data.availability === "today" && urgency !== "immediate") {
        urgency = "today";
        availability = "today";
      }
    }
  }

  return { date, time, urgency, availability };
}

export function extractIntent(
  rawQuery: string,
  context?: SessionContext
): ExtractedIntent {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();
  const language = detectLanguage(trimmed);

  // 1. Check Ambiguity Rules First
  for (const rule of AMBIGUITY_RULES) {
    const ambigRegex = new RegExp(`\\b${rule.term}\\b`, "i");
    if (ambigRegex.test(lower)) {
      // Check if qualified by context or query
      const isQualified = rule.qualifiers?.some((q) => lower.includes(q.toLowerCase())) ?? false;
      if (!isQualified) {
        const question = language === "en" ? rule.clarificationQuestion.en : rule.clarificationQuestion.hi;
        const options: ClarificationOption[] = rule.options.map((opt) => ({
          label: opt.label,
          value: opt.serviceId,
          category: opt.serviceId,
          service: opt.displayName,
          displayName: opt.displayName,
        }));

        const emptyEntities: ExtractedEntities = {
          service: null,
          location: extractLocation(trimmed) || context?.lastLocation || null,
          date: null,
          time: null,
          urgency: "flexible",
          budget: extractBudget(trimmed) || context?.lastBudget || null,
        };

        return {
          intent: "clarification_needed",
          canonicalCategory: null,
          service: undefined,
          serviceName: undefined,
          detectedLanguage: language,
          language,
          confidence: 0.6,
          rawQuery: trimmed,
          extractedEntities: emptyEntities,
          clarificationNeeded: true,
          clarificationQuestion: question,
          clarificationOptions: options,
          clarification: {
            question,
            options,
          },
          replyMessage: question,
          naturalResponse: question,
        };
      }
    }
  }

  // 2. Identify Service Category from Problem Phrases & Aliases
  let matchedCategory: (typeof SERVICE_TAXONOMY)[0] | undefined;
  let matchedAlias: string | undefined;
  let highestMatchScore = 0;

  for (const category of SERVICE_TAXONOMY) {
    // Problem phrases get top priority
    for (const phrase of category.problemPhrases) {
      if (lower.includes(phrase.toLowerCase())) {
        const score = 100 + phrase.length;
        if (score > highestMatchScore) {
          highestMatchScore = score;
          matchedCategory = category;
          matchedAlias = phrase;
        }
      }
    }

    // Aliases
    for (const alias of category.aliases) {
      const aliasLower = alias.toLowerCase();
      const regex = new RegExp(`\\b${aliasLower}\\b`, "i");
      if (regex.test(lower) || lower.includes(aliasLower)) {
        const score = 50 + aliasLower.length;
        if (score > highestMatchScore) {
          highestMatchScore = score;
          matchedCategory = category;
          matchedAlias = alias;
        }
      }
    }
  }

  // 3. Multi-turn Session Context Refinement
  let service = matchedCategory?.displayName;
  let canonicalCategory: string | null = matchedCategory?.id || null;
  const serviceAliases = matchedAlias ? [matchedAlias] : matchedCategory?.aliases.slice(0, 3);

  if (!canonicalCategory) {
    if (context?.lastCategory) {
      canonicalCategory = context.lastCategory;
      const found = SERVICE_TAXONOMY.find((t) => t.id === context.lastCategory);
      if (found) service = found.displayName;
    } else if (context?.previousIntent?.canonicalCategory) {
      canonicalCategory = context.previousIntent.canonicalCategory;
      service = context.previousIntent.service || context.previousIntent.serviceName;
    }
  }

  // 4. Extract Constraints
  const budget = extractBudget(trimmed) ?? context?.lastBudget ?? context?.previousIntent?.budget ?? context?.previousIntent?.extractedEntities?.budget ?? null;
  const extractedLoc = extractLocation(trimmed);
  const location = extractedLoc || context?.lastLocation || context?.previousIntent?.location || context?.previousIntent?.extractedEntities?.location || context?.userLocation?.city || null;
  
  const { date: exDate, time: exTime, urgency: exUrg, availability: exAvail } = extractTimeAndUrgency(trimmed);
  const urgency = exUrg !== "flexible" ? exUrg : (context?.lastUrgency || context?.previousIntent?.extractedEntities?.urgency || "flexible");
  const availability = exAvail || (urgency === "immediate" ? "now" : urgency === "today" ? "today" : "any");
  const date = exDate || (urgency === "immediate" || urgency === "today" ? "today" : context?.previousIntent?.date || null);
  const time = exTime || context?.previousIntent?.time || null;

  const confidence = matchedCategory ? 0.95 : canonicalCategory ? 0.85 : 0.4;

  const extractedEntities: ExtractedEntities = {
    service: service || null,
    location,
    date: date || null,
    time: time || null,
    urgency,
    budget,
  };

  // 5. Build Conversational Natural Response in User's Language
  let replyMessage = "";
  if (language === "en") {
    if (service) {
      const locPart = location ? ` in ${location}` : " near your area";
      const availPart = urgency === "immediate" ? " who are available right now" : "";
      const budgetPart = budget ? ` within ₹${budget}` : "";
      replyMessage = `Sure! Finding verified ${service.toLowerCase()}s${locPart}${availPart}${budgetPart}.`;
    } else {
      replyMessage = "I can help you find verified workers. What service do you need?";
    }
  } else if (language === "hi") {
    if (service) {
      const locPart = location ? `${location} में ` : "आपके आस-पास ";
      const availPart = urgency === "immediate" ? " तुरंत उपलब्ध " : " ";
      const budgetPart = budget ? `₹${budget} के अंदर ` : "";
      replyMessage = `ज़रूर! ${locPart}${budgetPart}${availPart}${service} खोजे जा रहे हैं।`;
    } else {
      replyMessage = "नमस्ते! आपको किस काम के लिए कारीगर चाहिए? (जैसे बढ़ई, बिजली वाला, प्लंबर)";
    }
  } else {
    // Hinglish
    if (service) {
      const locPart = location ? `${location} me ` : "Aapke paas ke ";
      const availPart = urgency === "immediate" ? " abhi available " : " ";
      const budgetPart = budget ? `₹${budget} ke andar ` : "";
      replyMessage = `Bilkul! ${locPart}${budgetPart}${availPart}${service.toLowerCase()}s dekh raha hoon.`;
    } else {
      replyMessage = "Namaste! Aapko kis kaam ke liye verified worker chahiye? (Jaise badhai, bijli wala, plumber)";
    }
  }

  return {
    intent: canonicalCategory ? "find_worker" : "help",
    canonicalCategory,
    service,
    serviceName: service,
    serviceAliases,
    detectedLanguage: language,
    language,
    confidence,
    rawQuery: trimmed,
    extractedEntities,
    location: location || undefined,
    date: date || undefined,
    time: time || undefined,
    budget: budget || undefined,
    availability,
    clarificationNeeded: false,
    replyMessage,
    naturalResponse: replyMessage,
  };
}
