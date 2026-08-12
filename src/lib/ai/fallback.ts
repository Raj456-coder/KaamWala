import { SearchIntent } from "./types";

const PROFESSION_KEYWORDS: Record<string, string[]> = {
  Electrician: ["electrician", "electric", "wiring", "fan", "light", "mcb", "socket", "inverter", "solar"],
  Plumber: ["plumber", "plumbing", "water", "leak", "pipe", "bathroom", "tap", "flush", "blockage", "drain"],
  Carpenter: ["carpenter", "carpentry", "wood", "furniture", "cabinet", "door", "window", "shelf"],
  Painter: ["painter", "paint", "wall", "color", "repaint", "interior", "exterior", "emulsion"],
  Welder: ["welder", "weld", "metal", "steel", "grill", "gate", "fabrication"],
  Mason: ["mason", "masonry", "brick", "concrete", "foundation", "wall", "construction"],
  Driver: ["driver", "driving", "license", "vehicle", "delivery", "transport"],
  "House Cleaner": ["cleaner", "cleaning", "housekeeping", "sweep", "mop", "dust", "vacuuming", "home cleaning"],
  "AC Repair": ["ac", "air conditioner", "cooling", "not cooling", "gas", "compressor", "ventilation", "ac repair"],
  "Mobile Repair": ["mobile", "phone", "smartphone", "screen", "battery", "charging", "repair"],
  "Computer Repair": ["computer", "laptop", "pc", "software", "hardware", "data", "virus"],
  Gardener: ["gardener", "garden", "plants", "lawn", "grass", "trees", "flowers"],
  Tailor: ["tailor", "sewing", "stitching", "clothes", "alteration", "dress", "fabric"],
  "RO Repair": ["ro", "purifier", "filter", "water purifier", "ro repair"],
  Photographer: ["photographer", "photo", "camera", "wedding", "event", "pre-wedding"],
  Tutor: ["tutor", "tuition", "teacher", "class", "exam", "jee", "neet", "maths", "science", "english"],
  Cook: ["cook", "chef", "cooking", "food", "tiffin", "catering", "meal"],
  "Internet Technician": ["internet", "wifi", "router", "broadband", "network", "lan", "connection"],
};

const TIME_KEYWORDS: Record<string, string[]> = {
  today: ["today", "now", "emergency", "urgent", "immediately", "asap"],
  tomorrow: ["tomorrow", "tomorrow morning", "tomorrow afternoon", "tomorrow evening"],
  this_week: ["this week", "this weekend", "weekend", "saturday", "sunday"],
  morning: ["morning", "7am", "8am", "9am", "10am", "11am", "early"],
  afternoon: ["afternoon", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"],
  evening: ["evening", "6pm", "7pm", "8pm", "9pm", "10pm"],
};

const LOCATION_KEYWORDS: Record<string, string[]> = {
  "Gomti Nagar": ["gomti nagar", "gomti"],
  Indiranagar: ["indiranagar"],
  "Lucknow": ["lucknow", "luttar"],
  Noida: ["noida"],
  Delhi: ["delhi", "ncr", "new delhi"],
  Mumbai: ["mumbai", "bombay", "bumbai"],
  Bangalore: ["bangalore", "banglore", "bengaluru"],
  Chennai: ["chennai", "madras"],
  Hyderabad: ["hyderabad", "hyd"],
  Kolkata: ["kolkata", "calcutta"],
  Pune: ["pune", "poona"],
  Ahmedabad: ["ahmedabad", "amdavad"],
  Jaipur: ["jaipur", "pink city"],
  "Kanpur": ["kanpur", "cawnpore"],
  Varanasi: ["varanasi", "banaras", "kashi"],
  Agra: ["agra", "agrah"],
  Patna: ["patna", "patliputra"],
};

const DISTANCE_PATTERN = /within\s+(\d+)\s*km/i;
const NEARBY_PATTERNS = [/\bnear\s+me\b/i, /\bnearby\b/i, /\bnear\s+my\s+location\b/i, /\bclose\s+to\s+me\b/i];
const EXPERIENCE_PATTERNS: Record<string, string[]> = {
  experienced: ["experienced", "expert", "senior", "professional", "skilled", "master"],
  fresher: ["fresher", "junior", "trainee", "beginner", "new"],
};
const PRICE_PATTERNS: Record<string, string[]> = {
  budget: ["cheap", "budget", "affordable", "low cost", "economical", "inexpensive"],
  premium: ["premium", "expensive", "high end", "luxury", "best quality"],
};

export function parseNaturalLanguage(query: string): SearchIntent {
  const lower = query.toLowerCase().trim();
  const keywords = lower.split(/\s+/).filter((k) => k.length > 2);

  let service: string | undefined;
  let location: string | undefined;
  let radiusKm: number | undefined;
  let availability: string | undefined;
  let urgency: string | undefined;
  let experience: string | undefined;
  let pricePreference: string | undefined;

  const distanceMatch = lower.match(DISTANCE_PATTERN);
  if (distanceMatch) {
    radiusKm = parseInt(distanceMatch[1], 10);
  }

  const isNearby = NEARBY_PATTERNS.some((p) => p.test(lower));

  if (isNearby && !location) {
    location = "current";
  }

  for (const [prof, kws] of Object.entries(PROFESSION_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        if (!service) {
          service = prof;
        }
        break;
      }
    }
  }

  for (const [time, kws] of Object.entries(TIME_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        availability = time;
        if (time === "today" || time === "tomorrow") {
          urgency = time;
        }
        break;
      }
    }
    if (availability) break;
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

  for (const [exp, kws] of Object.entries(EXPERIENCE_PATTERNS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        experience = exp;
        break;
      }
    }
    if (experience) break;
  }

  for (const [price, kws] of Object.entries(PRICE_PATTERNS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) {
        pricePreference = price;
        break;
      }
    }
    if (pricePreference) break;
  }

  return {
    service,
    location: location || (isNearby ? "current" : undefined),
    radiusKm,
    availability,
    urgency,
    experience,
    pricePreference,
    rawQuery: query,
    keywords,
  };
}
