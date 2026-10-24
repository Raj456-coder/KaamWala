/**
 * Multilingual Search & Regional Translation Parser for KaamWala
 * Supports Hindi (Devanagari & Hinglish), Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada.
 * Parses regional language queries into standardized English service tags.
 */

export type ServiceTier = "skilled" | "semi-skilled" | "non-skilled";

export interface CategorizedService {
  id: string; // canonical slug e.g. "electrician"
  name: string; // English title
  hindiName: string; // Hindi in Devanagari e.g. "इलेक्ट्रीशियन (बिजली वाला)"
  regionalNames: Record<string, string>; // e.g. { bn: "ইলেকট্রিশিয়ান", ta: "மின்சார பணியாளர்", te: "ఎలక్ట్రీషియన్" }
  tier: ServiceTier;
  tierLabel: {
    en: string;
    hi: string;
  };
  description: {
    en: string;
    hi: string;
  };
  icon: string; // Lucide icon identifier or emoji
  hourlyRange: string;
  platformFee: number; // ₹10 strictly
  popularTags: string[];
}

export const CATEGORIZED_SERVICES: CategorizedService[] = [
  // SKILLED TIER (कुशल कारीगर)
  {
    id: "electrician",
    name: "Electrician",
    hindiName: "इलेक्ट्रीशियन (बिजली वाला)",
    regionalNames: {
      hi: "बिजली मिस्त्री",
      bn: "ইলেকট্রিশিয়ান",
      ta: "மின்சார பணியாளர்",
      te: "ఎలక్ట్రీషియన్",
      mr: "इलेक्ट्रिशियन",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "Short-circuit repair, wiring, switchboards, inverter setup, fans & appliances",
      hi: "वायरिंग, पंखा, स्विच बोर्ड, एमसीबी, इन्वर्टर और शॉर्ट सर्किट समाधान",
    },
    icon: "Zap",
    hourlyRange: "₹250 - ₹500/hr",
    platformFee: 10,
    popularTags: ["Wiring", "Fan Repair", "Switchboard", "Short Circuit", "Inverter"],
  },
  {
    id: "plumber",
    name: "Plumber",
    hindiName: "प्लंबर (नल वाला)",
    regionalNames: {
      hi: "नल मिस्त्री",
      bn: "প্লাম্বার (নল মেরামত)",
      ta: "குழாய் பழுதுபார்ப்பவர்",
      te: "ప్లంబర్",
      mr: "प्लंबर (नळ कारागीर)",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "Pipe leakage, tap replacement, bathroom fittings, water tank & drain blockage",
      hi: "पाइप लीकेज, नल बदलना, बाथरूम फिटिंग, पानी की टंकी व ड्रेनेज ब्लॉकेज",
    },
    icon: "Wrench",
    hourlyRange: "₹250 - ₹450/hr",
    platformFee: 10,
    popularTags: ["Pipe Leak", "Tap Repair", "Water Tank", "Drain Blockage", "Bathroom Fitting"],
  },
  {
    id: "carpenter",
    name: "Carpenter",
    hindiName: "कारपेंटर (बढ़ई / सुतार)",
    regionalNames: {
      hi: "बढ़ई",
      bn: "ছুতোর (কাঠমিস্ত্রি)",
      ta: "தச்சர்",
      te: "వడ్రంగి",
      mr: "सुतार",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "Door locks, furniture repair, wooden modular cabinets, bed and table assembly",
      hi: "दरवाजे की कुंडी, फर्नीचर मरम्मत, लकड़ी की अलमारी, बेड व टेबल फिक्सिंग",
    },
    icon: "Hammer",
    hourlyRange: "₹300 - ₹600/hr",
    platformFee: 10,
    popularTags: ["Furniture Repair", "Door Lock", "Bed Assembly", "Woodwork", "Cabinets"],
  },
  {
    id: "ac-repair",
    name: "AC Technician",
    hindiName: "एसी मैकेनिक (कूलिंग एक्सपर्ट)",
    regionalNames: {
      hi: "एसी वाला",
      bn: "এসি টেকনিশিয়ান",
      ta: "ஏசி மெக்கானிக்",
      te: "ఏసీ టెక్నీషియన్",
      mr: "एसी मेकॅनिक",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "AC gas filling, cooling issues, split/window AC installation & deep jet service",
      hi: "गैस चार्जिंग, कूलिंग समस्या, स्प्लिट/विंडो एसी इंस्टॉलेशन व जेट सर्विस",
    },
    icon: "Snowflake",
    hourlyRange: "₹400 - ₹750/hr",
    platformFee: 10,
    popularTags: ["Gas Charging", "AC Servicing", "Split AC", "Cooling Issue", "Installation"],
  },
  {
    id: "mechanic",
    name: "Auto Mechanic",
    hindiName: "ऑटो मैकेनिक (गाड़ी मिस्त्री)",
    regionalNames: {
      hi: "मोटर मिस्त्री",
      bn: "মেকানিক",
      ta: "மெக்கானிக்",
      te: "మెకానిక్",
      mr: "मेकॅनिक",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "Two-wheeler breakdown, car battery jumpstart, puncture, engine tuning",
      hi: "बाइक/कार ब्रेकडाउन, पंचर, बैटरी जंपस्टार्ट, ऑयल चेंज व इंजन ट्यूनिंग",
    },
    icon: "Settings",
    hourlyRange: "₹300 - ₹600/hr",
    platformFee: 10,
    popularTags: ["Bike Repair", "Car Battery", "Puncture", "Engine Tuning", "Breakdown"],
  },
  {
    id: "welder",
    name: "Welder & Fabricator",
    hindiName: "वेल्डर (लोहा / ग्रिल कारीगर)",
    regionalNames: {
      hi: "वेल्डर मिस्त्री",
      bn: "ওয়েল্ডার",
      ta: "வெல்டர்",
      te: "వెల్డర్",
      mr: "वेल्डर",
    },
    tier: "skilled",
    tierLabel: { en: "Skilled Worker", hi: "कुशल कारीगर" },
    description: {
      en: "Iron gate welding, window grills, shed fabrication & metal railing repairs",
      hi: "लोहे के गेट, खिड़की की ग्रिल वेल्डिंग, शेड व रेलिंग की मरम्मत",
    },
    icon: "Flame",
    hourlyRange: "₹350 - ₹650/hr",
    platformFee: 10,
    popularTags: ["Gate Welding", "Window Grill", "Metal Railing", "Shed", "Iron Work"],
  },

  // SEMI-SKILLED TIER (अर्ध-कुशल कामगार)
  {
    id: "painter",
    name: "Painter",
    hindiName: "पेंटर (रंगाई व पुट्टी वाला)",
    regionalNames: {
      hi: "रंग वाला",
      bn: "রং মিস্ত্রি",
      ta: "பெயிண்டர்",
      te: "పెయింటర్",
      mr: "रंगारी",
    },
    tier: "semi-skilled",
    tierLabel: { en: "Semi-Skilled Worker", hi: "अर्ध-कुशल कामगार" },
    description: {
      en: "Interior/exterior wall painting, putty smoothing, waterproof coating & whitewash",
      hi: "दीवार की पुताई, पुट्टी, वाटरप्रूफिंग, डिस्टेंपर और सफेदी का काम",
    },
    icon: "Paintbrush",
    hourlyRange: "₹200 - ₹400/hr",
    platformFee: 10,
    popularTags: ["Wall Paint", "Putty", "Waterproofing", "Whitewash", "Exterior"],
  },
  {
    id: "mason",
    name: "Mason / Mistri",
    hindiName: "राजमिस्त्री (निर्माण व टाइल)",
    regionalNames: {
      hi: "राज मिस्त्री",
      bn: "রাজমিস্ত্রি",
      ta: "கொத்தனார்",
      te: "మేస్త్రీ",
      mr: "गवंडी (राजमिस्त्री)",
    },
    tier: "semi-skilled",
    tierLabel: { en: "Semi-Skilled Worker", hi: "अर्ध-कुशल कामगार" },
    description: {
      en: "Brickwork, plastering, marble & floor tile installation, wall renovation",
      hi: "ईंट जोड़ाई, दीवार प्लास्टर, फर्श की टाइल, मार्बल व मकान का छोटा निर्माण",
    },
    icon: "Boxes",
    hourlyRange: "₹300 - ₹550/hr",
    platformFee: 10,
    popularTags: ["Brickwork", "Plaster", "Tile Fitting", "Marble", "Boundary Wall"],
  },
  {
    id: "driver",
    name: "Personal Driver",
    hindiName: "पर्सनल ड्राइवर (चालक)",
    regionalNames: {
      hi: "ड्राइवर",
      bn: "ড্রাইভার",
      ta: "ஓட்டுநர்",
      te: "డ్రైవర్",
      mr: "चालक (ड्रायव्हर)",
    },
    tier: "semi-skilled",
    tierLabel: { en: "Semi-Skilled Worker", hi: "अर्ध-कुशल कामगार" },
    description: {
      en: "On-demand city driving, outstation trips, manual & automatic car expertise",
      hi: "लोकल सिटी ड्राइविंग, आउटस्टेशन सफर, कार चलाना व वैगन सेवा",
    },
    icon: "Car",
    hourlyRange: "₹200 - ₹350/hr",
    platformFee: 10,
    popularTags: ["City Driver", "Outstation", "Automatic Car", "Hourly Driver"],
  },
  {
    id: "cook",
    name: "Cook / Chef",
    hindiName: "रसोइया (बावर्ची / महाराज)",
    regionalNames: {
      hi: "खाना बनाने वाला",
      bn: "বাবুর্চি (রাঁধুনি)",
      ta: "சமையல்காரர்",
      te: "వంటమనిషి",
      mr: "आचारी (स्वयंपाकी)",
    },
    tier: "semi-skilled",
    tierLabel: { en: "Semi-Skilled Worker", hi: "अर्ध-कुशल कामगार" },
    description: {
      en: "Home-style Indian meals, party catering, breakfast, lunch & dinner prep",
      hi: "शुद्ध घरेलू भोजन, नाश्ता, लंच, डिनर व छोटी पार्टी का खाना बनाना",
    },
    icon: "Utensils",
    hourlyRange: "₹250 - ₹450/hr",
    platformFee: 10,
    popularTags: ["North Indian", "South Indian", "Party Cooking", "Daily Meals"],
  },
  {
    id: "babysitter",
    name: "Babysitter",
    hindiName: "बेबीसिटर (आया / बच्चों की देखभाल)",
    regionalNames: {
      hi: "आया / दाई",
      bn: "বেবিসিটার (আয়া)",
      ta: "குழந்தை பராமரிப்பாளர்",
      te: "బేబీసిట్టర్",
      mr: "आया (मुलांची काळजी)",
    },
    tier: "semi-skilled",
    tierLabel: { en: "Semi-Skilled Worker", hi: "अर्ध-कुशल कामगार" },
    description: {
      en: "Infant and child care, playful engagement, meal feeding, safety supervision & storytelling",
      hi: "बच्चों की देखभाल, खाना खिलाना, सुरक्षा निगरानी व प्यार से देखरेख",
    },
    icon: "Heart",
    hourlyRange: "₹200 - ₹350/hr",
    platformFee: 10,
    popularTags: ["Babysitting", "Child Care", "Aaya", "Toddler", "Nanny"],
  },

  // NON-SKILLED TIER (सामान्य सहायक / मजदूर)
  {
    id: "house-maid",
    name: "House Maid / Helper",
    hindiName: "कामवाली बाई (घरेलू सहायिका)",
    regionalNames: {
      hi: "कामवाली",
      bn: "গৃহকর্মী (কাজের মাসি)",
      ta: "வீட்டு வேலை ஆள்",
      te: "పనిమనిషి",
      mr: "कामवाली बाई",
    },
    tier: "non-skilled",
    tierLabel: { en: "Non-Skilled / General Help", hi: "सामान्य सहायक / मजदूर" },
    description: {
      en: "Sweeping, mopping, utensil washing, dusting & daily household chores",
      hi: "झाड़ू-पोंछा, बर्तन धोना, डस्टिंग और दैनिक घरेलू कामकाज",
    },
    icon: "Sparkle",
    hourlyRange: "₹150 - ₹250/hr",
    platformFee: 10,
    popularTags: ["Jhadu Pocha", "Bartan", "Dusting", "Daily Help", "House Cleaning"],
  },
  {
    id: "bathroom-cleaner",
    name: "Bathroom Cleaner",
    hindiName: "बाथरूम क्लीनर (टॉयलेट व टाइल धुलाई)",
    regionalNames: {
      hi: "बाथरूम सफाई वाला",
      bn: "বাথরুম ক্লিনার",
      ta: "குளியலறை தூய்மை பணியாளர்",
      te: "బాత్రూమ్ క్లీనర్",
      mr: "बाथरूम सफाई कामगार",
    },
    tier: "non-skilled",
    tierLabel: { en: "Non-Skilled / General Help", hi: "सामान्य सहायक / मजदूर" },
    description: {
      en: "Bathroom deep sanitization, toilet scrubbing, tile descaling, stain removal & tap shine",
      hi: "बाथरूम की गहरी धुलाई, टॉयलेट सीट क्लीनिंग, टाइल स्क्रबिंग व बदबू हटाना",
    },
    icon: "Sparkles",
    hourlyRange: "₹150 - ₹300/hr",
    platformFee: 10,
    popularTags: ["Bathroom Cleaning", "Toilet Wash", "Tiles Scrubbing", "Sanitation", "Stain Removal"],
  },
  {
    id: "cleaner",
    name: "Deep Cleaner",
    hindiName: "सफाई कर्मी (डीप क्लीनिंग)",
    regionalNames: {
      hi: "सफाई वाला",
      bn: "পরিচ্ছন্নতাকর্মী",
      ta: "துப்புரவு பணியாளர்",
      te: "క్లీనర్",
      mr: "सफाई कामगार",
    },
    tier: "non-skilled",
    tierLabel: { en: "Non-Skilled / General Help", hi: "सामान्य सहायक / मजदूर" },
    description: {
      en: "Full house deep sanitation, sofa shampoo, kitchen degreasing & water tank wash",
      hi: "किचन की सफाई, सोफा शैम्पू, पानी की टंकी व पूरे मकान की डीप क्लीनिंग",
    },
    icon: "Sparkles",
    hourlyRange: "₹200 - ₹350/hr",
    platformFee: 10,
    popularTags: ["Kitchen Degrease", "Sofa Wash", "Full Home", "Tank Cleaning"],
  },
  {
    id: "laborer",
    name: "General Helper / Beldar",
    hindiName: "मजदूर / बेलदार (भारी सामान उठाना)",
    regionalNames: {
      hi: "मजदूर",
      bn: "শ্রমিক (কুলি)",
      ta: "உதவியாளர் / கூலி",
      te: "కూలీ / శ్రామికుడు",
      mr: "मजूर (हमाल)",
    },
    tier: "non-skilled",
    tierLabel: { en: "Non-Skilled / General Help", hi: "सामान्य सहायक / मजदूर" },
    description: {
      en: "Loading, unloading, house shifting assistance, garden clearing & debris disposal",
      hi: "सामान चढ़ाना-उतारना, घर शिफ्टिंग में मदद, मलबा हटाना व मजदूरी",
    },
    icon: "Truck",
    hourlyRange: "₹150 - ₹300/hr",
    platformFee: 10,
    popularTags: ["Loading Unloading", "Shifting Help", "Debris Removal", "Daily Labor"],
  },
  {
    id: "gardener",
    name: "Gardener",
    hindiName: "माली (बगीचा देखभाल)",
    regionalNames: {
      hi: "माली भैया",
      bn: "মালী",
      ta: "தோட்டக்காரர்",
      te: "తోటమాలి",
      mr: "माळी",
    },
    tier: "non-skilled",
    tierLabel: { en: "Non-Skilled / General Help", hi: "सामान्य सहायक / मजदूर" },
    description: {
      en: "Lawn mowing, tree pruning, plant potting, weeding & organic pesticide spraying",
      hi: "घास कटाई, पेड़-पौधों की छंटाई, गमले भरना व बगीचे की सफाई",
    },
    icon: "Trees",
    hourlyRange: "₹180 - ₹300/hr",
    platformFee: 10,
    popularTags: ["Lawn Mowing", "Potting", "Tree Pruning", "Garden Care"],
  },
];

/**
 * Regional vocabulary map linking Indian regional terms, Devanagari, and Hinglish to standard English service tags
 */
const REGIONAL_TO_TAG_MAP: Record<string, string> = {
  // Electrician
  "बिजली वाला": "electrician",
  "बिजली": "electrician",
  "इलेक्ट्रीशियन": "electrician",
  "पंखा खराब": "electrician",
  "लाइट": "electrician",
  "वायरिंग": "electrician",
  "bijli": "electrician",
  "bijliwala": "electrician",
  "bijli wala": "electrician",
  "pankha": "electrician",
  "wiring": "electrician",
  "short circuit": "electrician",
  "इলেকট্রিশিয়ান": "electrician",
  "மின்சார பணியாளர்": "electrician",
  "ఎలక్ట్రీషియన్": "electrician",
  "इलेक्ट्रिशियन": "electrician",

  // Plumber
  "नल वाला": "plumber",
  "नल": "plumber",
  "प्लंबर": "plumber",
  "पाइप लीक": "plumber",
  "पानी बह रहा": "plumber",
  "पानी": "plumber",
  "टंकी": "plumber",
  "nal wala": "plumber",
  "nalwala": "plumber",
  "nal mistri": "plumber",
  "pipe leak": "plumber",
  "paani tapak": "plumber",
  "flush": "plumber",
  "প্লাম্বার": "plumber",
  "குழாய் பழுது": "plumber",
  "ప్లంబర్": "plumber",

  // Carpenter
  "बढ़ई": "carpenter",
  "कारपेंटर": "carpenter",
  "सुतार": "carpenter",
  "लकड़ी का काम": "carpenter",
  "दरवाजा खराब": "carpenter",
  "ताला": "carpenter",
  "फर्नीचर": "carpenter",
  "badhai": "carpenter",
  "barhai": "carpenter",
  "darwaza": "carpenter",
  "taala": "carpenter",
  "furniture": "carpenter",
  "ছুতোর": "carpenter",
  "தச்சர்": "carpenter",
  "వడ్రంగి": "carpenter",

  // AC Technician
  "एसी वाला": "ac-repair",
  "एसी": "ac-repair",
  "एसी सर्विस": "ac-repair",
  "एसी ठंडा नहीं कर रहा": "ac-repair",
  "गैस": "ac-repair",
  "ac wala": "ac-repair",
  "ac thanda nahi": "ac-repair",
  "cooling problem": "ac-repair",
  "ac gas": "ac-repair",
  "এসি": "ac-repair",
  "ஏசி": "ac-repair",
  "ఏసీ": "ac-repair",

  // Painter
  "पेंटर": "painter",
  "रंग वाला": "painter",
  "सफेदी": "painter",
  "पुट्टी": "painter",
  "पुताई": "painter",
  "दीवार पेंट": "painter",
  "rang wala": "painter",
  "putty": "painter",
  "safedi": "painter",
  "rangai": "painter",
  "रং মিস্ত্রি": "painter",
  "பெயிண்டர்": "painter",
  "పెయింటర్": "painter",

  // Mason
  "राजमिस्त्री": "mason",
  "राज मिस्त्री": "mason",
  "मिस्त्री": "mason",
  "ईंट जोड़ाई": "mason",
  "प्लास्टर": "mason",
  "टाइल": "mason",
  "raj mistri": "mason",
  "mistri": "mason",
  "plaster": "mason",
  "tile mistri": "mason",
  "chhat dhalai": "mason",
  "রাজমিস্ত্রি": "mason",
  "கொத்தனார்": "mason",
  "మేస్త్రీ": "mason",

  // House Maid
  "कामवाली": "house-maid",
  "कामवाली बाई": "house-maid",
  "झाड़ू पोंछा": "house-maid",
  "बर्तन": "house-maid",
  "सफाई वाली": "house-maid",
  "kaamwali": "house-maid",
  "kamwali": "house-maid",
  "jhadu pocha": "house-maid",
  "bartan wali": "house-maid",
  "bai": "house-maid",
  "গৃহকর্মী": "house-maid",
  "வீட்டு வேலை": "house-maid",
  "పనిమనిషి": "house-maid",

  // Deep Cleaner
  "सफाई कर्मी": "cleaner",
  "सफाई": "cleaner",
  "डीप क्लीनिंग": "cleaner",
  "घर की सफाई": "cleaner",
  "safai wala": "cleaner",
  "deep cleaning": "cleaner",
  "bathroom safai": "cleaner",

  // Mechanic
  "मैकेनिक": "mechanic",
  "गाड़ी खराब": "mechanic",
  "पंचर": "mechanic",
  "मोटर मिस्त्री": "mechanic",
  "bike kharab": "mechanic",
  "car kharab": "mechanic",
  "puncture": "mechanic",

  // Driver
  "ड्राइवर": "driver",
  "चालक": "driver",
  "गाड़ी चलाने वाला": "driver",
  "driver chahiye": "driver",
  "car chalane wala": "driver",

  // Cook
  "रसोइया": "cook",
  "बावर्ची": "cook",
  "खाना बनाने वाला": "cook",
  "cook chahiye": "cook",
  "khana banane": "cook",
  "maharaj": "cook",

  // Laborer
  "मजदूर": "laborer",
  "बेलदार": "laborer",
  "सामान उठाना": "laborer",
  "कुली": "laborer",
  "मजदूरी": "laborer",
  "majdoor": "laborer",
  "beldar": "laborer",
  "saman uthane wala": "laborer",
  "hamal": "laborer",

  // Gardener
  "माली": "gardener",
  "पौधे": "gardener",
  "बगीचा": "gardener",
  "mali": "gardener",
  "bagicha": "gardener",
  "garden": "gardener",
};

export interface MultilingualParseResult {
  detectedLanguage: string;
  originalQuery: string;
  translatedEnglishQuery: string;
  serviceTag: string | null;
  serviceDisplayName: string | null;
  serviceHindiName: string | null;
  tier: ServiceTier | null;
  confidence: number;
}

/**
 * Parses user input in Hindi (Devanagari/Latin), Bengali, Tamil, Telugu, Marathi, etc.
 * into standard English service tags.
 */
export async function parseRegionalLanguageQuery(rawQuery: string): Promise<MultilingualParseResult> {
  const trimmed = rawQuery.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return {
      detectedLanguage: "en",
      originalQuery: rawQuery,
      translatedEnglishQuery: "",
      serviceTag: null,
      serviceDisplayName: null,
      serviceHindiName: null,
      tier: null,
      confidence: 0,
    };
  }

  // 1. Check if input contains non-Latin scripts (Devanagari, Bengali, Tamil, Telugu, etc.)
  const isDevanagari = /[\u0900-\u097F]/.test(trimmed);
  const isBengali = /[\u0980-\u09FF]/.test(trimmed);
  const isTamil = /[\u0B80-\u0BFF]/.test(trimmed);
  const isTelugu = /[\u0C00-\u0C7F]/.test(trimmed);

  let detectedLanguage = "en";
  if (isDevanagari) detectedLanguage = "hi";
  else if (isBengali) detectedLanguage = "bn";
  else if (isTamil) detectedLanguage = "ta";
  else if (isTelugu) detectedLanguage = "te";
  else if (/\b(chahiye|wala|wali|kharab|kaam|karna|hai|me|ho gaya)\b/i.test(lower)) {
    detectedLanguage = "hinglish";
  }

  // 2. Direct regional mapping check
  for (const [key, tag] of Object.entries(REGIONAL_TO_TAG_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      const matchService = CATEGORIZED_SERVICES.find((s) => s.id === tag);
      return {
        detectedLanguage,
        originalQuery: rawQuery,
        translatedEnglishQuery: `${matchService?.name || tag} Service`,
        serviceTag: tag,
        serviceDisplayName: matchService?.name || tag,
        serviceHindiName: matchService?.hindiName || null,
        tier: matchService?.tier || null,
        confidence: 0.95,
      };
    }
  }

  // 3. Fallback translation via free public translation API if non-Latin or complex text
  if (detectedLanguage !== "en" && typeof window !== "undefined") {
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${detectedLanguage === "hinglish" ? "hi" : detectedLanguage}|en`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(apiUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const json = await res.json();
        const translatedText = json?.responseData?.translatedText?.toLowerCase() || "";

        // Check translated English text against services
        for (const service of CATEGORIZED_SERVICES) {
          const serviceNameLower = service.name.toLowerCase();
          const idLower = service.id.toLowerCase();
          if (translatedText.includes(serviceNameLower) || translatedText.includes(idLower)) {
            return {
              detectedLanguage,
              originalQuery: rawQuery,
              translatedEnglishQuery: json.responseData.translatedText,
              serviceTag: service.id,
              serviceDisplayName: service.name,
              serviceHindiName: service.hindiName,
              tier: service.tier,
              confidence: 0.9,
            };
          }
        }
      }
    } catch {
      // Graceful fallback to default query
    }
  }

  // 4. English keyword check across all categorized services
  for (const service of CATEGORIZED_SERVICES) {
    if (
      lower.includes(service.name.toLowerCase()) ||
      lower.includes(service.id.toLowerCase()) ||
      service.popularTags.some((tag) => lower.includes(tag.toLowerCase()))
    ) {
      return {
        detectedLanguage,
        originalQuery: rawQuery,
        translatedEnglishQuery: service.name,
        serviceTag: service.id,
        serviceDisplayName: service.name,
        serviceHindiName: service.hindiName,
        tier: service.tier,
        confidence: 0.85,
      };
    }
  }

  return {
    detectedLanguage,
    originalQuery: rawQuery,
    translatedEnglishQuery: rawQuery,
    serviceTag: null,
    serviceDisplayName: null,
    serviceHindiName: null,
    tier: null,
    confidence: 0.2,
  };
}
