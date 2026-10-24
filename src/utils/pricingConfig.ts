/**
 * Centralized Pricing Configuration for KaamWala
 * Single source of truth for standard category hourly rates and ranges
 * Synchronizes:
 * - "Find Services" (Auto-match aggregator)
 * - "Find Workers" (Manual profile cards & search filters)
 * - Dummy Worker Seeding Scripts
 * - 4-Step Booking Wizard
 */

export interface CategoryPricing {
  id: string; // canonical slug identifier (e.g. "electrician", "plumber", "babysitter")
  name: string; // Display name in English
  hindiName: string; // Display name in Hindi
  standardHourlyRate: number; // e.g. 300
  minHourlyRate: number; // e.g. 250
  maxHourlyRate: number; // e.g. 500
  rateDisplay: string; // e.g. "₹300/hr"
  rangeDisplay: string; // e.g. "₹250 - ₹500/hr"
  minVisitCharge: number; // e.g. 150
  unit: string; // "/hr"
}

export const CATEGORY_PRICING: Record<string, CategoryPricing> = {
  electrician: {
    id: "electrician",
    name: "Electrician",
    hindiName: "इलेक्ट्रीशियन (बिजली वाला)",
    standardHourlyRate: 300,
    minHourlyRate: 250,
    maxHourlyRate: 500,
    rateDisplay: "₹300/hr",
    rangeDisplay: "₹250 - ₹500/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  plumber: {
    id: "plumber",
    name: "Plumber",
    hindiName: "प्लंबर (नल वाला)",
    standardHourlyRate: 300,
    minHourlyRate: 250,
    maxHourlyRate: 450,
    rateDisplay: "₹300/hr",
    rangeDisplay: "₹250 - ₹450/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  "house-maid": {
    id: "house-maid",
    name: "House Maid",
    hindiName: "कामवाली बाई (घरेलू सहायिका)",
    standardHourlyRate: 200,
    minHourlyRate: 150,
    maxHourlyRate: 250,
    rateDisplay: "₹200/hr",
    rangeDisplay: "₹150 - ₹250/hr",
    minVisitCharge: 100,
    unit: "/hr",
  },
  babysitter: {
    id: "babysitter",
    name: "Babysitter",
    hindiName: "बेबीसिटर (आया / बच्चों की देखभाल)",
    standardHourlyRate: 250,
    minHourlyRate: 200,
    maxHourlyRate: 350,
    rateDisplay: "₹250/hr",
    rangeDisplay: "₹200 - ₹350/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  cook: {
    id: "cook",
    name: "Cook",
    hindiName: "रसोइया (बावर्ची / हलवाई)",
    standardHourlyRate: 350,
    minHourlyRate: 250,
    maxHourlyRate: 450,
    rateDisplay: "₹350/hr",
    rangeDisplay: "₹250 - ₹450/hr",
    minVisitCharge: 200,
    unit: "/hr",
  },
  "bathroom-cleaner": {
    id: "bathroom-cleaner",
    name: "Bathroom Cleaner",
    hindiName: "बाथरूम क्लीनर (टॉयलेट व डीप क्लीन)",
    standardHourlyRate: 200,
    minHourlyRate: 150,
    maxHourlyRate: 300,
    rateDisplay: "₹200/hr",
    rangeDisplay: "₹150 - ₹300/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  carpenter: {
    id: "carpenter",
    name: "Carpenter",
    hindiName: "कारपेंटर (बढ़ई / सुतार)",
    standardHourlyRate: 350,
    minHourlyRate: 300,
    maxHourlyRate: 600,
    rateDisplay: "₹350/hr",
    rangeDisplay: "₹300 - ₹600/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  painter: {
    id: "painter",
    name: "Painter",
    hindiName: "पेंटर (रंगाई व पुट्टी)",
    standardHourlyRate: 250,
    minHourlyRate: 200,
    maxHourlyRate: 400,
    rateDisplay: "₹250/hr",
    rangeDisplay: "₹200 - ₹400/hr",
    minVisitCharge: 150,
    unit: "/hr",
  },
  "ac-repair": {
    id: "ac-repair",
    name: "AC Technician",
    hindiName: "एसी मैकेनिक (कूलिंग एक्सपर्ट)",
    standardHourlyRate: 450,
    minHourlyRate: 400,
    maxHourlyRate: 750,
    rateDisplay: "₹450/hr",
    rangeDisplay: "₹400 - ₹750/hr",
    minVisitCharge: 250,
    unit: "/hr",
  },
  mason: {
    id: "mason",
    name: "Mason / Mistri",
    hindiName: "राजमिस्त्री (निर्माण व टाइल)",
    standardHourlyRate: 350,
    minHourlyRate: 300,
    maxHourlyRate: 550,
    rateDisplay: "₹350/hr",
    rangeDisplay: "₹300 - ₹550/hr",
    minVisitCharge: 200,
    unit: "/hr",
  },
  laborer: {
    id: "laborer",
    name: "General Laborer",
    hindiName: "मजदूर (सामान उठाना / लोडिंग)",
    standardHourlyRate: 180,
    minHourlyRate: 150,
    maxHourlyRate: 250,
    rateDisplay: "₹180/hr",
    rangeDisplay: "₹150 - ₹250/hr",
    minVisitCharge: 100,
    unit: "/hr",
  },
  gardener: {
    id: "gardener",
    name: "Gardener",
    hindiName: "माली (बागवानी व पेड़-पौधे)",
    standardHourlyRate: 200,
    minHourlyRate: 150,
    maxHourlyRate: 300,
    rateDisplay: "₹200/hr",
    rangeDisplay: "₹150 - ₹300/hr",
    minVisitCharge: 100,
    unit: "/hr",
  },
};

/**
 * Normalizes any category string or profession name to get standard hourly rate & range
 */
export function getCategoryPricing(categoryOrProfession?: string): CategoryPricing {
  if (!categoryOrProfession) {
    return {
      id: "general",
      name: "General Service",
      hindiName: "सामान्य सेवा",
      standardHourlyRate: 250,
      minHourlyRate: 200,
      maxHourlyRate: 400,
      rateDisplay: "₹250/hr",
      rangeDisplay: "₹200 - ₹400/hr",
      minVisitCharge: 150,
      unit: "/hr",
    };
  }

  const query = categoryOrProfession.toLowerCase().trim().replace(/\s+/g, "-");

  // Direct key lookup
  if (CATEGORY_PRICING[query]) {
    return CATEGORY_PRICING[query];
  }

  const raw = categoryOrProfession.toLowerCase().trim();

  // Pattern matching
  if (raw.includes("electric") || raw.includes("bijli")) return CATEGORY_PRICING.electrician;
  if (raw.includes("plumb") || raw.includes("nal")) return CATEGORY_PRICING.plumber;
  if (raw.includes("maid") || raw.includes("kamwali") || raw.includes("bai") || raw.includes("jhadu") || raw.includes("bartan")) return CATEGORY_PRICING["house-maid"];
  if (raw.includes("baby") || raw.includes("sitter") || raw.includes("aaya") || raw.includes("child")) return CATEGORY_PRICING.babysitter;
  if (raw.includes("cook") || raw.includes("chef") || raw.includes("khana") || raw.includes("bawarchi") || raw.includes("rasoi")) return CATEGORY_PRICING.cook;
  if (raw.includes("bath") || raw.includes("toilet") || raw.includes("washroom")) return CATEGORY_PRICING["bathroom-cleaner"];
  if (raw.includes("clean") || raw.includes("safai")) return CATEGORY_PRICING["bathroom-cleaner"];
  if (raw.includes("carpent") || raw.includes("badhai") || raw.includes("wood")) return CATEGORY_PRICING.carpenter;
  if (raw.includes("paint") || raw.includes("rang") || raw.includes("putty")) return CATEGORY_PRICING.painter;
  if (raw.includes("ac") || raw.includes("cool")) return CATEGORY_PRICING["ac-repair"];
  if (raw.includes("mason") || raw.includes("mistri") || raw.includes("raj")) return CATEGORY_PRICING.mason;
  if (raw.includes("labor") || raw.includes("helper") || raw.includes("majdoor") || raw.includes("load")) return CATEGORY_PRICING.laborer;
  if (raw.includes("garden") || raw.includes("mali") || raw.includes("plant")) return CATEGORY_PRICING.gardener;

  return {
    id: query,
    name: categoryOrProfession,
    hindiName: categoryOrProfession,
    standardHourlyRate: 250,
    minHourlyRate: 200,
    maxHourlyRate: 400,
    rateDisplay: "₹250/hr",
    rangeDisplay: "₹200 - ₹400/hr",
    minVisitCharge: 150,
    unit: "/hr",
  };
}

export function getStandardHourlyRate(categoryOrProfession?: string): number {
  return getCategoryPricing(categoryOrProfession).standardHourlyRate;
}

export function getHourlyRangeDisplay(categoryOrProfession?: string): string {
  return getCategoryPricing(categoryOrProfession).rangeDisplay;
}
