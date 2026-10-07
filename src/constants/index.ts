import {
  Category,
  Testimonial,
  FAQ,
  Step,
  Statistic,
  Feature,
} from "@/types";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Electrician", slug: "electrician", icon: "Zap", description: "Wiring, repairs, installations", workerCount: 245, image: "/images/categories/electrician.jpg" },
  { id: "2", name: "Plumber", slug: "plumber", icon: "Wrench", description: "Pipes, fittings, drainage", workerCount: 189, image: "/images/categories/plumber.jpg" },
  { id: "3", name: "Painter", slug: "painter", icon: "Paintbrush", description: "Interior, exterior, texture", workerCount: 156, image: "/images/categories/painter.jpg" },
  { id: "4", name: "Carpenter", slug: "carpenter", icon: "Hammer", description: "Furniture, fittings, repair", workerCount: 134, image: "/images/categories/carpenter.jpg" },
  { id: "5", name: "Mechanic", slug: "mechanic", icon: "Settings", description: "Vehicle repair, service", workerCount: 112, image: "/images/categories/mechanic.jpg" },
  { id: "6", name: "Driver", slug: "driver", icon: "Car", description: "Personal, commercial, cab", workerCount: 298, image: "/images/categories/driver.jpg" },
  { id: "7", name: "Cleaner", slug: "cleaner", icon: "Sparkles", description: "Home, office, deep clean", workerCount: 167, image: "/images/categories/cleaner.jpg" },
  { id: "8", name: "Construction Labour", slug: "construction-labour", icon: "HardHat", description: "Mason, helper, site work", workerCount: 203, image: "/images/categories/construction.jpg" },
  { id: "9", name: "AC Repair", slug: "ac-repair", icon: "Snowflake", description: "Installation, service, gas", workerCount: 89, image: "/images/categories/ac-repair.jpg" },
  { id: "10", name: "RO Repair", slug: "ro-repair", icon: "Droplets", description: "Purifier service, filter change", workerCount: 76, image: "/images/categories/ro-repair.jpg" },
  { id: "11", name: "Welder", slug: "welder", icon: "Flame", description: "Metal welding, fabrication", workerCount: 64, image: "/images/categories/welder.jpg" },
  { id: "12", name: "Mason", slug: "mason", icon: "Layers", description: "Brick work, plastering, tiling", workerCount: 91, image: "/images/categories/mason.jpg" },
  { id: "13", name: "House Maid", slug: "house-maid", icon: "Home", description: "Cleaning, cooking, babysitting", workerCount: 210, image: "/images/categories/housemaid.jpg" },
  { id: "14", name: "Cook", slug: "cook", icon: "ChefHat", description: "Home cook, catering, tiffin", workerCount: 145, image: "/images/categories/cook.jpg" },
  { id: "15", name: "Tutor", slug: "tutor", icon: "BookOpen", description: "Home tuition, exam prep", workerCount: 178, image: "/images/categories/tutor.jpg" },
  { id: "16", name: "Photographer", slug: "photographer", icon: "Camera", description: "Event, wedding, portfolio", workerCount: 56, image: "/images/categories/photographer.jpg" },
  { id: "17", name: "Internet Technician", slug: "internet-technician", icon: "Wifi", description: "WiFi setup, router, broadband", workerCount: 42, image: "/images/categories/internet-technician.jpg" },
];



export const TESTIMONIALS: Testimonial[] = [
  { id: "1", name: "Priya Mehta", role: "Homeowner", avatar: "/images/testimonials/avatar-1.jpg", content: "Found an amazing electrician within minutes. The worker was verified, professional, and finished the job on time. Highly recommend KaamWala!", rating: 5 },
  { id: "2", name: "Rahul Gupta", role: "Business Owner", avatar: "/images/testimonials/avatar-2.jpg", content: "We use KaamWala for all our office maintenance needs. The quality of workers is consistently excellent and pricing is transparent.", rating: 5 },
  { id: "3", name: "Anjali Singh", role: "Rental Property Manager", avatar: "/images/testimonials/avatar-3.jpg", content: "Managing multiple properties is now so much easier. KaamWala connects us with reliable workers instantly. The verification process gives us peace of mind.", rating: 4 },
  { id: "4", name: "Vikram Joshi", role: "Restaurant Owner", avatar: "/images/testimonials/avatar-4.jpg", content: "The platform is incredibly easy to use. I needed a plumber urgently and found one within 2km. The worker arrived on time and did a great job.", rating: 5 },
];

export const FAQS: FAQ[] = [
  { id: "1", question: "How do I find a worker on KaamWala?", answer: "Simply search for the service you need, browse verified workers near you, check their ratings and experience, and book instantly. You can also call or WhatsApp them directly." },
  { id: "2", question: "Are all workers verified?", answer: "Yes, every worker on KaamWala goes through a thorough verification process including ID verification, skill assessment, and background checks to ensure your safety." },
  { id: "3", question: "How much does it cost to hire a worker?", answer: "Costs vary by service type, worker experience, and job complexity. You can view hourly rates upfront before booking. There are no hidden charges." },
  { id: "4", question: "Can I cancel or reschedule a booking?", answer: "Yes, you can cancel or reschedule bookings up to 2 hours before the scheduled time without any cancellation fee." },
  { id: "5", question: "Is my payment secure?", answer: "Absolutely. We use secure payment gateways with bank-grade encryption. You can pay online or cash on service completion." },
  { id: "6", question: "Do workers come with tools and materials?", answer: "Most workers bring basic tools. For specific materials or special equipment, you can discuss with the worker beforehand or request them to bring it at an additional cost." },
];

export const HOW_IT_WORKS: Step[] = [
  { id: 1, title: "Search", description: "Enter the service you need and your location. Browse through verified workers near you.", icon: "Search" },
  { id: 2, title: "Choose", description: "Compare workers by ratings, experience, distance, and price. Read reviews from other customers.", icon: "CheckCircle" },
  { id: 3, title: "Hire", description: "Book instantly, call, or send a WhatsApp message. The worker arrives at your doorstep ready to work.", icon: "Users" },
];

export const STATISTICS: Statistic[] = [
  { id: 1, value: "10,000+", label: "Verified Workers", suffix: "+" },
  { id: 2, value: "5,000+", label: "Happy Customers", suffix: "+" },
  { id: 3, value: "100+", label: "Cities Covered", suffix: "+" },
  { id: 4, value: "50,000+", label: "Jobs Completed", suffix: "+" },
];

export const FEATURES: Feature[] = [
  { id: 1, title: "Verified Workers", description: "Every worker undergoes rigorous background checks and skill verification for your safety and peace of mind.", icon: "ShieldCheck" },
  { id: 2, title: "Fast Hiring", description: "Find and book workers in under 2 minutes. No waiting, no hassle. Get the help you need instantly.", icon: "Zap" },
  { id: 3, title: "Secure Payments", description: "Pay online or cash on completion. All transactions are secured with industry-standard encryption.", icon: "Lock" },
  { id: 4, title: "Nearby Search", description: "Discover skilled workers in your neighborhood. Save time with location-based search and matching.", icon: "MapPin" },
];
