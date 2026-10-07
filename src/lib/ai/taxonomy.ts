export interface ServiceCategoryTaxonomy {
  id: string; // canonical identifier (slug)
  displayName: string; // e.g. "Carpenter"
  hindiName: string; // e.g. "बढ़ई"
  hinglishName: string; // e.g. "Badhai"
  aliases: string[]; // English, Hindi (Devanagari & Latin), Hinglish synonyms
  problemPhrases: string[]; // Common complaints / user expressions
  typicalSkills: string[];
}

export interface AmbiguityRule {
  term: string;
  qualifiers?: string[];
  clarificationQuestion: {
    hi: string;
    en: string;
  };
  options: {
    label: string;
    serviceId: string;
    displayName: string;
  }[];
}

export const SERVICE_TAXONOMY: ServiceCategoryTaxonomy[] = [
  {
    id: "carpenter",
    displayName: "Carpenter",
    hindiName: "बढ़ई",
    hinglishName: "Badhai",
    aliases: [
      "carpenter", "carpentry", "wood worker", "woodworker", "furniture",
      "badhai", "barhai", "badaee", "khati", "sutar",
      "बढ़ई", "सुतार", "खाती", "फर्नीचर", "लकड़ी का काम",
      "lakdi ka kaam", "wood work", "woodwork", "furniture maker"
    ],
    problemPhrases: [
      "darwaza kharab", "door repair", "table repair", "bed repair", "chair repair",
      "window repair", "khidki kharab", "almirah repair", "almari repair",
      "door lock repair", "kabza kharab", "handle lagana", "modular kitchen repair",
      "furniture toot gaya", "wooden door", "sofa frame"
    ],
    typicalSkills: ["Furniture Repair", "Door Installation", "Cabinet Making", "Wood Polishing", "Lock Fitting"],
  },
  {
    id: "electrician",
    displayName: "Electrician",
    hindiName: "बिजली वाला",
    hinglishName: "Bijli Wala",
    aliases: [
      "electrician", "electrical", "electric", "wiring", "technician",
      "bijli wala", "bijliwala", "bijli mistri", "electric wala",
      "बिजली वाला", "इलेक्ट्रीशियन", "बिजली", "वायरिंग"
    ],
    problemPhrases: [
      "ghar me light ka problem hai", "light problem", "light kharab", "light nahi jal rahi",
      "bijli ka kaam", "bijli ka kaam hai", "fan repair", "pankha kharab", "pankha repair",
      "switch kharab", "switchboard", "socket", "short circuit", "mcb trip",
      "fuse ud gaya", "inverter repair", "tube light", "cooler wiring", "meter repair"
    ],
    typicalSkills: ["House Wiring", "Fan Repair", "Switchboard Installation", "MCB Repair", "Inverter Setup"],
  },
  {
    id: "plumber",
    displayName: "Plumber",
    hindiName: "नल वाला",
    hinglishName: "Nal Wala",
    aliases: [
      "plumber", "plumbing", "pipe fitter", "pipe worker", "sanitary",
      "nal wala", "nalwala", "nal mistri", "pipe wala", "pani wala",
      "नल वाला", "प्लंबर", "पाइप वाला", "नल"
    ],
    problemPhrases: [
      "nal leak ho raha hai", "pipe leak", "pipe leakage", "nal leak", "pani tapak raha hai",
      "bathroom ka pipe leak", "tap repair", "nal kharab", "flush kharab", "flush repair",
      "water tank", "tanki overflow", "motor repair", "bathroom fitting", "shower kharab",
      "drainage block", "naali block", "paani nahi aa raha", "sink block"
    ],
    typicalSkills: ["Pipe Leakage Repair", "Tap Replacement", "Bathroom Fittings", "Drain Cleaning", "Water Tank Installation"],
  },
  {
    id: "house-maid",
    displayName: "House Maid",
    hindiName: "कामवाली बाई",
    hinglishName: "Kaamwali Bai",
    aliases: [
      "maid", "house maid", "housemaid", "domestic helper", "house help", "cleaning lady",
      "kaamwali", "kamwali", "kaam wali", "bai", "aayah",
      "कामवाली", "कामवाली बाई", "बाई", "नौकरानी", "घर का काम"
    ],
    problemPhrases: [
      "ghar ki safai ke liye bai chahiye", "bai chahiye", "kaamwali chahiye",
      "ghar saaf karne wali", "jhadu pocha", "pocha lagana", "bartan wali",
      "bartan dhone wali", "cooking aur safai", "house help chahiye", "maid for cleaning"
    ],
    typicalSkills: ["House Cleaning", "Sweeping & Mopping", "Utensil Washing", "Dusting", "Elderly Assistance"],
  },
  {
    id: "ac-repair",
    displayName: "AC Repair",
    hindiName: "एसी रिपेयर",
    hinglishName: "AC Wala",
    aliases: [
      "ac repair", "ac service", "air conditioner", "ac technician", "hvac",
      "ac wala", "acwala", "ac mechanic",
      "एसी रिपेयर", "एसी वाला", "एयर कंडीशनर", "एसी सर्विस"
    ],
    problemPhrases: [
      "ac kharab hai", "ac thanda nahi kar raha", "ac cooling nahi kar raha",
      "cooling problem", "ac gas charging", "ac leaking", "ac pani phek raha hai",
      "split ac repair", "window ac repair", "ac installation", "ac service karwani hai",
      "ac on nahi ho raha"
    ],
    typicalSkills: ["Gas Charging", "AC Servicing", "Compressor Repair", "Split AC Installation", "Cooling Coil Repair"],
  },
  {
    id: "painter",
    displayName: "Painter",
    hindiName: "रंग वाला",
    hinglishName: "Rang Wala",
    aliases: [
      "painter", "painting", "wall painter", "whitewash",
      "rang wala", "rangwala", "paint wala", "putty wala", "safedi wala",
      "रंग वाला", "पेंटर", "सफेदी", "पुट्टी"
    ],
    problemPhrases: [
      "mujhe painting karwani hai", "ghar paint karna hai", "ghar paint karwana hai",
      "deewar paint karni hai", "wall painting", "room painting", "safedi karwani hai",
      "putty lagani hai", "distemper karwana hai", "waterproofing", "texture paint"
    ],
    typicalSkills: ["Interior Painting", "Exterior Painting", "Wall Putty", "Texture Painting", "Waterproofing"],
  },
  {
    id: "mason",
    displayName: "Mason",
    hindiName: "राज मिस्त्री",
    hinglishName: "Raj Mistri",
    aliases: [
      "mason", "masonry", "bricklayer", "construction worker",
      "raj mistri", "rajmistri", "construction mistri", "tile mistri", "marble mistri",
      "राज मिस्त्री", "राजमिस्त्री", "चिनाई मिस्त्री"
    ],
    problemPhrases: [
      "raj mistri chahiye", "construction ka kaam", "deewar banwani hai", "eent jodna",
      "plaster karwana hai", "tile lagwani hai", "flooring karwani hai", "marble lagwana",
      "bathroom renovation", "chhat dhalai", "boundary wall"
    ],
    typicalSkills: ["Brickwork", "Plastering", "Tiles & Marble Fitting", "Concrete Work", "Renovation"],
  },
  {
    id: "mechanic",
    displayName: "Mechanic",
    hindiName: "मैकेनिक",
    hinglishName: "Mechanic",
    aliases: [
      "mechanic", "auto mechanic", "vehicle repair", "automobile mechanic",
      "bike mechanic", "car mechanic", "motor mechanic", "gaadi mechanic",
      "car mistri", "gadi mistri", "gaadi mistri", "bike mistri", "motor mistri",
      "मैकेनिक", "गाड़ी मैकेनिक", "मोटर मैकेनिक", "कार मिस्त्री", "गाड़ी मिस्त्री"
    ],
    problemPhrases: [
      "bike kharab hai", "bike mechanic chahiye", "gaadi repair", "gadi kharab hai",
      "car kharab ho gayi", "scooter repair", "puncture", "bike start nahi ho rahi",
      "car service", "brake problem", "engine oil change"
    ],
    typicalSkills: ["Two Wheeler Repair", "Car Servicing", "Engine Tuning", "Brake Repair", "Puncture Fixing"],
  },
  {
    id: "cleaner",
    displayName: "Cleaner",
    hindiName: "सफाई वाला",
    hinglishName: "Safai Wala",
    aliases: [
      "cleaner", "cleaning", "house cleaner", "deep cleaner", "sanitization",
      "safai wala", "safaiwala", "cleaning boy",
      "सफाई वाला", "डीप क्लीनिंग"
    ],
    problemPhrases: [
      "deep cleaning", "office cleaning", "sofa cleaning", "bathroom deep cleaning",
      "kitchen cleaning", "water tank cleaning", "ghar saaf karwana hai"
    ],
    typicalSkills: ["Deep Cleaning", "Sofa Shampooing", "Kitchen Degreasing", "Bathroom Sanitation"],
  },
  {
    id: "cook",
    displayName: "Cook",
    hindiName: "रसोइया",
    hinglishName: "Cook",
    aliases: [
      "cook", "chef", "home cook", "kitchen cook",
      "rasoiya", "khana banane wala", "khana banane wali", "maharaj", "halwai",
      "रसोइया", "कुक", "महाराज", "हलवाई"
    ],
    problemPhrases: [
      "cook chahiye", "khana banane ke liye", "ghar ka khana", "tiffin cook", "party cook", "breakfast aur dinner"
    ],
    typicalSkills: ["North Indian Cooking", "South Indian Dishes", "Healthy Meals", "Party Catering"],
  },
  {
    id: "driver",
    displayName: "Driver",
    hindiName: "ड्राइवर",
    hinglishName: "Driver",
    aliases: [
      "driver", "chauffeur", "car driver",
      "gaadi chalane wala", "gadi chalane wala", "personal driver",
      "ड्राइवर", "गाड़ी चालक"
    ],
    problemPhrases: [
      "driver chahiye", "outstation driver", "personal car driver", "daily driver", "temporary driver"
    ],
    typicalSkills: ["Manual & Automatic Driving", "Highway Driving", "City Navigation", "Vehicle Maintenance"],
  },
  {
    id: "welder",
    displayName: "Welder",
    hindiName: "वेल्डर",
    hinglishName: "Welder",
    aliases: [
      "welder", "welding", "fabricator", "metal worker",
      "loha mistri", "welding wala",
      "वेल्डर", "वेल्डिंग", "लोहा मिस्त्री"
    ],
    problemPhrases: [
      "welding karwani hai", "gate toot gaya", "grill repair", "lohe ka gate", "shutter repair", "iron welding"
    ],
    typicalSkills: ["Arc Welding", "Iron Gate Repair", "Window Grill Fabrication", "Metal Cutting"],
  },
  {
    id: "ro-repair",
    displayName: "RO Repair",
    hindiName: "आरओ रिपेयर",
    hinglishName: "RO Wala",
    aliases: [
      "ro repair", "ro service", "water purifier", "aquaguard",
      "ro wala", "purifier repair", "filter wala",
      "आरओ रिपेयर", "वाटर प्यूरीफायर", "आरओ सर्विस"
    ],
    problemPhrases: [
      "ro kharab hai", "water purifier service", "filter change karwana hai",
      "ro ka paani kharab aa raha hai", "ro leakage", "ro on nahi ho raha"
    ],
    typicalSkills: ["Membrane Replacement", "Filter Service", "TDS Adjustment", "Booster Pump Repair"],
  },
  {
    id: "tutor",
    displayName: "Tutor",
    hindiName: "ट्यूटर",
    hinglishName: "Tutor",
    aliases: [
      "tutor", "tuition", "home tutor", "teacher",
      "tuition teacher", "padhane wala", "padhane wali",
      "ट्यूटर", "शिक्षक", "होम ट्यूशन"
    ],
    problemPhrases: [
      "home tutor chahiye", "bachhe ke liye tuition", "maths tutor", "science teacher", "board exam preparation"
    ],
    typicalSkills: ["CBSE & ICSE Curriculum", "Maths & Science", "Primary & High School", "Concept Clearing"],
  },
  {
    id: "photographer",
    displayName: "Photographer",
    hindiName: "फोटोग्राफर",
    hinglishName: "Photographer",
    aliases: [
      "photographer", "photography", "videographer", "cameraman",
      "photo wala", "shoot wala",
      "फोटोग्राफर", "कैमरामैन"
    ],
    problemPhrases: [
      "photographer chahiye", "birthday photo shoot", "wedding photographer", "event photography", "portfolio shoot"
    ],
    typicalSkills: ["Portrait Photography", "Event Coverage", "Videography", "Photo Editing"],
  },
  {
    id: "internet-technician",
    displayName: "Internet Technician",
    hindiName: "इंटरनेट टेक्नीशियन",
    hinglishName: "WiFi Wala",
    aliases: [
      "internet technician", "wifi technician", "broadband", "network technician",
      "wifi wala", "net wala", "router repair",
      "इंटरनेट टेक्नीशियन", "वाईफाई रिपेयर"
    ],
    problemPhrases: [
      "wifi nahi chal raha", "net band hai", "router setup", "lan wire problem", "fiber cable repair", "slow internet"
    ],
    typicalSkills: ["Router Configuration", "Fiber Splicing", "LAN Cabling", "WiFi Optimization"],
  }
];

export const AMBIGUITY_RULES: AmbiguityRule[] = [
  {
    term: "mistri",
    qualifiers: [
      "raj", "raaj", "car", "gadi", "gaadi", "bike", "auto", "motor", "loha", "bijli", "light", "lakdi", "plaster", "diwar", "chhat", "chunai"
    ],
    clarificationQuestion: {
      hi: "Aapko kis tarah ke mistri ki zaroorat hai? (Raj Mistri / Carpenter / Mechanic)",
      en: "What kind of mistri do you need? (Construction Mason / Carpenter / Mechanic)",
    },
    options: [
      { label: "🧱 Raj Mistri (Construction)", serviceId: "mason", displayName: "Mason (Raj Mistri)" },
      { label: "🪚 Carpenter (Wood Work)", serviceId: "carpenter", displayName: "Carpenter" },
      { label: "🔧 Mechanic (Vehicle / Motor)", serviceId: "mechanic", displayName: "Mechanic" },
      { label: "⚡ Bijli Mistri (Electrician)", serviceId: "electrician", displayName: "Electrician" },
    ],
  },
];

export const TIME_TERMS: Record<string, { date?: "today" | "tomorrow"; time?: "morning" | "afternoon" | "evening" | "now"; availability?: "now" | "today" }> = {
  // Urgent / Immediate
  "abhi": { time: "now", availability: "now" },
  "now": { time: "now", availability: "now" },
  "urgent": { time: "now", availability: "now" },
  "immediately": { time: "now", availability: "now" },
  "turant": { time: "now", availability: "now" },
  "jaldi": { time: "now", availability: "now" },
  "emergency": { time: "now", availability: "now" },

  // Today
  "aaj": { date: "today", availability: "today" },
  "today": { date: "today", availability: "today" },
  "aaj shaam": { date: "today", time: "evening", availability: "today" },
  "aaj shaam ko": { date: "today", time: "evening", availability: "today" },
  "this evening": { date: "today", time: "evening", availability: "today" },
  "aaj subah": { date: "today", time: "morning", availability: "today" },
  "this morning": { date: "today", time: "morning", availability: "today" },

  // Tomorrow
  "kal": { date: "tomorrow" },
  "tomorrow": { date: "tomorrow" },
  "kal subah": { date: "tomorrow", time: "morning" },
  "tomorrow morning": { date: "tomorrow", time: "morning" },
  "kal shaam": { date: "tomorrow", time: "evening" },
  "tomorrow evening": { date: "tomorrow", time: "evening" },

  // Generic time of day
  "shaam": { time: "evening" },
  "shaam ko": { time: "evening" },
  "evening": { time: "evening" },
  "subah": { time: "morning" },
  "morning": { time: "morning" },
  "dopahar": { time: "afternoon" },
  "afternoon": { time: "afternoon" },
  "raat": { time: "evening" },
  "night": { time: "evening" },
};
