import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.");
  console.error("Please set it to the path of your Firebase service account key JSON file.");
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(readFileSync(serviceAccountPath, "utf-8"))),
});

const db = getFirestore();

const CATEGORIES = [
  "Electrician",
  "Plumber",
  "Painter",
  "Carpenter",
  "Mechanic",
  "Driver",
  "Cleaner",
  "Construction Labour",
  "AC Repair",
  "RO Repair",
  "Welder",
  "Mason",
  "House Maid",
  "Cook",
  "Tutor",
  "Photographer",
  "Internet Technician",
];

const FIRST_NAMES = [
  "Ramesh", "Suresh", "Amit", "Vijay", "Prakash", "Deepak", "Mohan", "Raju", "Sunita", "Kishore",
  "Sanjay", "Rekha", "Vikram", "Anil", "Dinesh", "Bharat", "Kavita", "Rahul", "Pooja", "Gopal",
  "Lalita", "Birju", "Nitin", "Rajesh", "Sachin", "Meera", "Arjun", "Imran", "Ravi", "Suman",
  "Priya", "Neha", "Pankaj", "Tarun", "Divya", "Aarti", "Richa", "Komal", "Anjali", "Shalini",
  "Vinod", "Sandeep", "Manoj", "Ritu", "Faisal", "Sunit", "Rajinder", "Kavita", "Naveen", "Tarun",
  "Rohit", "Deepak", "Amit", "Suman", "Vivek", "Pooja", "Meera", "Anil", "Sunil", "Rahul",
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Verma", "Singh", "Patel", "Tiwari", "Yadav", "Lal", "Thakur", "Pandey",
  "Gupta", "Rathi", "Mohan", "Raju", "Devi", "Kumar", "Verma", "Rathore", "Singh", "Pandey",
  "Mishra", "Joshi", "Agarwal", "Malhotra", "Kapoor", "Iyer", "Choudhary", "Khan", "Tyagi", "Jindal",
  "Bansal", "Aggarwal", "Sethi", "Bhatia", "Chopra", "Dhawan", "Garg", "Jain", "Khanna", "Mehta",
  "Nair", "Oberoi", "Reddy", "Saxena", "Tandon", "Vohra", "Walia", "Bhardwaj", "Chauhan", "Dube",
  "Farooqui", "Goswami", "Hegde", "Iqbal", "Kulkarni", "Luthra", "Malik", "Negi", "Padmanabhan", "Quraishi",
];

const CITIES = [
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Prayagraj", state: "Uttar Pradesh" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Delhi", state: "Delhi" },
  { city: "Gurgaon", state: "Haryana" },
  { city: "Faridabad", state: "Haryana" },
  { city: "Chandigarh", state: "Punjab" },
  { city: "Amritsar", state: "Punjab" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Jodhpur", state: "Rajasthan" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Patna", state: "Bihar" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Bangalore", state: "Karnataka" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Kochi", state: "Kerala" },
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Guwahati", state: "Assam" },
  { city: "Ahmedabad", state: "Gujarat" },
];

const SKILLS_MAP: Record<string, string[]> = {
  Electrician: ["Wiring", "AC Repair", "Fans", "Lighting", "Panel Board", "LED Installation", "Inverter", "Solar Panel"],
  Plumber: ["Pipes", "Bathroom", "Leak Repair", "Drainage", "Water Heater", "Tap Installation", "Drain Cleaning"],
  Painter: ["Interior Painting", "Exterior Painting", "Texture", "Wallpaper", "Wall Putty"],
  Carpenter: ["Furniture", "Cabinets", "Doors", "Windows", "Furniture Repair", "Shelf Installation"],
  Mechanic: ["Car Repair", "Bike Repair", "Engine Overhaul", "Oil Change", "Car Service"],
  Driver: ["Manual", "Auto", "Long Distance", "Sedan", "SUV", "Outstation", "Maruti", "Hyundai"],
  Cleaner: ["Deep Cleaning", "Kitchen", "Bathroom", "Office Cleaning", "Sofa Cleaning", "Carpet Cleaning", "Pest Control", "Home Cleaning", "Utensil Cleaning", "Dusting"],
  "Construction Labour": ["Mason", "Helper", "Site Work", "Brick Work", "Concrete", "Plastering"],
  "AC Repair": ["AC Installation", "Gas Refill", "Maintenance", "Dryer Cleaning", "Window AC", "Split AC", "Cooling Issue"],
  "RO Repair": ["RO Service", "Filter Change", "AMC", "Purifier Service"],
  Welder: ["MIG Welding", "TIG Welding", "Fabrication", "Metal Work"],
  Mason: ["Brick Work", "Plastering", "Tiling", "Concrete"],
  "House Maid": ["Cleaning", "Cooking", "Babysitting", "Utensil Cleaning", "Dusting"],
  Cook: ["North Indian", "South Indian", "Chinese", "Rajasthani", "Gujarati", "Punjabi", "Home Cook", "Catering", "Tiffin"],
  Tutor: ["Mathematics", "Physics", "JEE Prep", "Science", "Computer", "Spoken English", "English", "Social Studies", "Competitive Exams"],
  Photographer: ["Wedding", "Event", "Pre-wedding", "Portfolio"],
  "Internet Technician": ["WiFi Setup", "Router", "Broadband", "LAN", "Network Security"],
};

const LANGUAGES = ["Hindi", "English", "Urdu", "Punjabi", "Gujarati", "Marathi", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Haryanvi", "Bhojpuri", "Awadhi", "Rajasthani"];

const ADJECTIVES = ["Experienced", "Professional", "Skilled", "Expert", "Reliable", "Certified", "Friendly", "Trusted", "Qualified", "Senior"];
const DESCRIPTIONS: Record<string, string[]> = {
  Electrician: ["Expert in residential and commercial wiring.", "Specialized in AC repair and panel installations.", "Quick and reliable electrical services.", "Certified electrician with safety-first approach."],
  Plumber: ["Reliable plumber for all residential needs.", "Expert in bathroom fittings and pipe repairs.", "Quick leak repair and drainage solutions.", "Professional plumbing with transparent pricing."],
  Painter: ["Professional painter with texture expertise.", "Clean finish and on-time delivery.", "Interior and exterior painting specialist.", "Premium quality paint and skilled workmanship."],
  Carpenter: ["Skilled carpenter for custom furniture.", "Expert in modular kitchen and door fittings.", "Budget-friendly carpentry solutions.", "Quality craftsmanship for home and office."],
  Mechanic: ["Experienced mechanic for all vehicles.", "Quick diagnosis and affordable repairs.", "Certified auto technician with modern tools.", "Reliable service for cars and bikes."],
  Driver: ["Professional driver with clean record.", "Safe and smooth driving guaranteed.", "Familiar with city routes and traffic.", "Experienced in office commute and outstation."],
  Cleaner: ["Professional cleaner with attention to detail.", "Deep cleaning and sanitization expert.", "Eco-friendly cleaning solutions.", "Thorough cleaning for homes and offices."],
  "Construction Labour": ["Experienced mason for construction projects.", "Reliable helper for site work.", "Quality brickwork and plastering.", "Hardworking team for all construction needs."],
  "AC Repair": ["Certified AC technician for all brands.", "Same-day service available.", "Expert in gas refill and maintenance.", "Quick and affordable AC repair."],
  "RO Repair": ["RO specialist with genuine spare parts.", "Prompt service and maintenance.", "Expert in all major RO brands.", "Filter change and AMC services."],
  Welder: ["Expert welder with industrial experience.", "Clean and strong welds guaranteed.", "Metal fabrication and repair specialist.", "Professional welding for residential and commercial."],
  Mason: ["Senior mason for construction and renovation.", "Quality tile work and brick laying.", "Experienced in plastering and tiling.", "Reliable mason for new builds and repairs."],
  "House Maid": ["Trusted maid for full-time and part-time.", "Hardworking and honest helper.", "Experienced in cooking and cleaning.", "Reliable house help for daily tasks."],
  Cook: ["Home chef with authentic recipes.", "Specialty in North Indian and traditional meals.", "Hygienic cooking with fresh ingredients.", "Experienced cook for daily meals and catering."],
  Tutor: ["Expert tutor for school and competitive exams.", "Patient and knowledgeable instructor.", "My students grades improved significantly.", "Friendly tutor for all subjects."],
  Photographer: ["Creative photographer for all occasions.", "Stunning wedding and event coverage.", "Professional portfolio and pre-wedding shoots.", "Capturing life's beautiful moments."],
  "Internet Technician": ["Expert in WiFi and network setup.", "Quick router and broadband troubleshooting.", "Reliable technician for home and office networks.", "Certified network professional."],
};

const REVIEW_COMMENTS = [
  "Excellent work! Very professional and punctual.",
  "Good service. Fixed the issue in one visit.",
  "Amazing work! Highly recommended.",
  "Great craftsmanship. Very satisfied.",
  "Quick service and reasonable charges.",
  "Very thorough and detail-oriented.",
  "On time and did a great job.",
  "Friendly and professional. Will hire again.",
  "Best service in the area!",
  "Decent work for the price.",
  "Very patient and knowledgeable.",
  "Smooth experience from booking to completion.",
  "Quality work and fair pricing.",
  "Highly skilled and reliable.",
  "Completed the job ahead of schedule.",
];

const SERVICE_TYPES = [
  "Electrician - Wiring",
  "Plumber - Leak Repair",
  "Painter - Interior",
  "Carpenter - Furniture",
  "Mechanic - Car Service",
  "Driver - Outstation",
  "Cleaner - Deep Clean",
  "Mason - Brick Work",
  "AC Repair - Gas Refill",
  "RO Repair - Filter Change",
  "Welder - Fabrication",
  "Tutor - Mathematics",
  "Cook - Daily Meals",
  "Photographer - Wedding",
  "Internet Technician - WiFi Setup",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomItems<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generatePhone(): string {
  const prefixes = ["98", "99", "97", "96", "95", "94", "93", "92", "91", "90", "88", "89", "87", "86", "85"];
  const prefix = randomItem(prefixes);
  const rest = Array.from({ length: 8 }, () => randomInt(0, 9)).join("");
  return `+91 ${prefix}${rest}`;
}

function generateEmail(name: string): string {
  const domains = ["gmail.com", "yahoo.in", "hotmail.com", "outlook.com", "rediffmail.com"];
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  return `${cleanName}@${randomItem(domains)}`;
}

function generateAddress(city: string): string {
  const areas = [
    "Sector 12", "Sector 18", "Sector 22", "Indirapuram", "Vaishali", "Lajpat Nagar",
    "Rajouri Garden", "Janakpuri", "Rohini", "Dwarka", "Mayur Vihar", "Kaushambi",
    "Saraswati Vihar", "Malviya Nagar", "Vasant Kunj", "Pitampura", "Okhla", "Nehru Place",
    "Greater Kailash", "Hauz Khas", "Connaught Place", "Preet Vihar", "Alambagh", "Gomti Nagar",
    "Indiranagar", "Badarpur", "Najafgarh", "Faridabad", "Sahibabad", "Burari",
  ];
  const streets = ["Main Street", "Park Avenue", "Lake View", "Block A", "Block B", "Road No. 5", "Market Road", "Station Road"];
  return `${randomInt(1, 150)} ${randomItem(streets)}, ${randomItem(areas)}, ${city}`;
}

async function clearCollection(collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function seedWorkers(count: number): Promise<void> {
  console.log(`Seeding ${count} workers...`);
  const batchSize = 500;
  let processed = 0;

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const category = randomItem(CATEGORIES);
    const skills = randomItems(SKILLS_MAP[category] || ["General"], randomInt(2, 5));
    const langs = randomItems(LANGUAGES, randomInt(1, 4));
    const cityData = randomItem(CITIES);
    const experience = randomInt(1, 25);
    const hourlyRate = randomInt(150, 2000);
    const rating = Math.round((randomInt(30, 50) / 10) * 10) / 10;
    const reviewCount = randomInt(5, 200);
    const isVerified = Math.random() > 0.2;
    const isAvailable = Math.random() > 0.3;
    const joinedDate = new Date(Date.now() - randomInt(30, 1500) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const startHour = randomInt(6, 10);
    const endHour = randomInt(17, 22);
    const availableDays = randomItems(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], randomInt(3, 7)).sort();

    const workerData = {
      uid: `worker-${i + 1}`,
      email: generateEmail(fullName),
      name: fullName,
      role: "worker",
      personalInfo: {
        fullName,
        email: generateEmail(fullName),
        phone: generatePhone(),
        address: generateAddress(cityData.city),
      },
      professionalInfo: {
        profession: category,
        experience,
        hourlyRate,
        minVisitCharge: hourlyRate > 500 ? randomInt(200, 500) : null,
        description: randomItem(ADJECTIVES) + " " + category.toLowerCase() + ". " + randomItem(DESCRIPTIONS[category] || DESCRIPTIONS["Electrician"]),
        skills,
        languages: langs,
        category,
      },
      documents: {},
      availability: {
        serviceRadius: randomInt(3, 25),
        availableDays,
        workingHours: { start: `${startHour.toString().padStart(2, "0")}:00`, end: `${endHour.toString().padStart(2, "0")}:00` },
        emergencyService: Math.random() > 0.7,
        homeVisit: Math.random() > 0.3,
      },
      serviceArea: {
        state: cityData.state,
        city: cityData.city,
        pincode: randomInt(100000, 999999).toString(),
      },
      verificationStatus: isVerified ? "verified" : (Math.random() > 0.5 ? "pending" : "rejected"),
      rating,
      reviewCount,
      reviews: [],
      isAvailable,
      isVerified,
      joinedDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("workers").doc(`worker-${i + 1}`).set(workerData);
    processed++;

    if (processed % batchSize === 0) {
      console.log(`  Seeded ${processed}/${count} workers...`);
    }
  }
  console.log(`  Completed seeding ${processed} workers.`);
}

async function seedCustomers(count: number): Promise<void> {
  console.log(`Seeding ${count} customers...`);
  const batchSize = 500;
  let processed = 0;

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    const customerData = {
      uid: `customer-${i + 1}`,
      email: generateEmail(fullName),
      name: fullName,
      phone: generatePhone(),
      role: "customer",
      bookings: [],
      savedWorkers: [],
      reviewsGiven: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("customers").doc(`customer-${i + 1}`).set(customerData);
    processed++;

    if (processed % batchSize === 0) {
      console.log(`  Seeded ${processed}/${count} customers...`);
    }
  }
  console.log(`  Completed seeding ${processed} customers.`);
}

async function seedBookings(count: number, workerCount: number, customerCount: number): Promise<void> {
  console.log(`Seeding ${count} bookings...`);
  const batchSize = 500;
  let processed = 0;

  const statuses = ["pending", "accepted", "rejected", "confirmed", "in-progress", "completed", "cancelled"] as const;

  for (let i = 0; i < count; i++) {
    const workerId = `worker-${randomInt(1, workerCount)}`;
    const customerId = `customer-${randomInt(1, customerCount)}`;
    const serviceType = randomItem(SERVICE_TYPES);
    const status = randomItem(statuses);
    const date = new Date(Date.now() - randomInt(0, 180) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const totalAmount = randomInt(300, 5000);
    const earnings = status === "completed" ? Math.round(totalAmount * 0.9) : (status === "cancelled" ? 0 : Math.round(totalAmount * randomInt(5, 8) / 10));

    const bookingData = {
      id: `booking-${i + 1}`,
      customerId,
      workerId,
      customerName: `Customer ${customerId.split("-")[1]}`,
      workerName: `Worker ${workerId.split("-")[1]}`,
      workerImage: "",
      service: serviceType,
      description: `Need ${serviceType.toLowerCase()} service at my place.`,
      date,
      time: `${randomInt(8, 17).toString().padStart(2, "0")}:${randomInt(0, 1) === 0 ? "00" : "30"} ${randomInt(0, 1) === 0 ? "AM" : "PM"}`,
      address: generateAddress(randomItem(CITIES).city),
      landmark: randomItem(["Near Temple", "Near School", "Near Market", "Near Park", "Near Hospital", ""]),
      notes: randomInt(0, 1) === 1 ? "Please bring required materials." : "",
      duration: randomItem(["1hr", "2hr", "3hr", "4hr", "Full day"]),
      status,
      totalAmount,
      earnings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("bookings").doc(`booking-${i + 1}`).set(bookingData);
    processed++;

    if (processed % batchSize === 0) {
      console.log(`  Seeded ${processed}/${count} bookings...`);
    }
  }
  console.log(`  Completed seeding ${processed} bookings.`);
}

async function seedReviews(count: number, bookingCount: number, workerCount: number, customerCount: number): Promise<void> {
  console.log(`Seeding ${count} reviews...`);
  const batchSize = 500;
  let processed = 0;

  for (let i = 0; i < count; i++) {
    const workerId = `worker-${randomInt(1, workerCount)}`;
    const customerId = `customer-${randomInt(1, customerCount)}`;
    const bookingId = `booking-${randomInt(1, bookingCount)}`;
    const rating = randomInt(3, 5);
    const comment = randomItem(REVIEW_COMMENTS);

    const reviewData = {
      id: `review-${i + 1}`,
      bookingId,
      customerId,
      workerId,
      rating,
      comment,
      createdAt: new Date(),
    };

    await db.collection("reviews").doc(`review-${i + 1}`).set(reviewData);
    processed++;

    if (processed % batchSize === 0) {
      console.log(`  Seeded ${processed}/${count} reviews...`);
    }
  }
  console.log(`  Completed seeding ${processed} reviews.`);
}

async function updateWorkerStats(): Promise<void> {
  console.log("Updating worker stats...");
  const snapshot = await db.collection("workers").get();
  const batch = db.batch();
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const reviewCount = data.reviewCount || 0;
    const rating = data.rating || 0;
    batch.update(docSnap.ref, { reviewCount, rating });
  });
  await batch.commit();
  console.log(`  Updated stats for ${snapshot.size} workers.`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("KaamWala Demo Data Seeder");
  console.log("=".repeat(50));

  const WORKER_COUNT = 200;
  const CUSTOMER_COUNT = 100;
  const BOOKING_COUNT = 150;
  const REVIEW_COUNT = 500;

  try {
    console.log("\nClearing existing data...");
    await clearCollection("reviews");
    await clearCollection("bookings");
    await clearCollection("customers");
    await clearCollection("workers");
    await clearCollection("users");
    console.log("  Existing data cleared.");

    await seedWorkers(WORKER_COUNT);
    await seedCustomers(CUSTOMER_COUNT);
    await seedBookings(BOOKING_COUNT, WORKER_COUNT, CUSTOMER_COUNT);
    await seedReviews(REVIEW_COUNT, BOOKING_COUNT, WORKER_COUNT, CUSTOMER_COUNT);
    await updateWorkerStats();

    console.log("\n" + "=".repeat(50));
    console.log("Seeding completed successfully!");
    console.log(`  Workers:     ${WORKER_COUNT}`);
    console.log(`  Customers:   ${CUSTOMER_COUNT}`);
    console.log(`  Bookings:    ${BOOKING_COUNT}`);
    console.log(`  Reviews:     ${REVIEW_COUNT}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
