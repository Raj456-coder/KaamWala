export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  workerCount: number;
  image: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviewCount: number;
  experience: number;
  distance: string;
  hourlyRate: number;
  minVisitCharge?: number;
  isVerified: boolean;
  isAvailable: boolean;
  image: string;
  location: string;
  skills: string[];
  description: string;
  languages: string[];
  availability: string;
  joinedDate: string;
  portfolioImages: string[];
  reviews: Review[];
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Statistic {
  id: number;
  value: string;
  label: string;
  suffix?: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  keyword?: string;
  minRating?: number;
  maxDistance?: number;
  availability?: boolean;
  verifiedOnly?: boolean;
  experience?: number[];
  priceRange?: [number, number];
  sortBy?: "rating" | "distance" | "price" | "experience" | "newest";
}

export interface WorkerCardProps {
  worker: WorkerProfile;
  index?: number;
}
