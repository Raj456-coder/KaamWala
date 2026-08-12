export const WORKER_SUBSCRIPTION_PLANS: {
  id: "free" | "basic" | "pro";
  name: string;
  price: number;
  duration: string;
  features: string[];
  badge?: string;
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    duration: "Forever",
    features: [
      "Basic profile listing",
      "Standard visibility in search",
      "Up to 3 portfolio images",
      "Basic analytics",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 199,
    duration: "per month",
    features: [
      "Enhanced profile visibility",
      "Priority in search results",
      "Up to 10 portfolio images",
      "Advanced analytics dashboard",
      "Customer insights",
      "Badge display",
    ],
    badge: "Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    duration: "per month",
    features: [
      "Maximum profile visibility",
      "Featured placement on homepage",
      "Unlimited portfolio images",
      "Premium analytics & reports",
      "Direct customer leads",
      "Premium badge",
      "Dedicated support",
    ],
    badge: "Best Value",
  },
];

export const CUSTOMER_MEMBERSHIP_PLANS: {
  id: "free" | "premium";
  name: string;
  price: number;
  duration: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    duration: "Forever",
    features: [
      "Standard worker discovery",
      "Basic booking experience",
      "Standard support",
      "Basic recommendations",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 149,
    duration: "per month",
    features: [
      "Priority worker discovery",
      "Enhanced AI recommendations",
      "Faster booking experience",
      "Priority customer support",
      "Exclusive membership offers",
      "No ads experience",
    ],
  },
];

export const ADVERTISING_PLANS: {
  id: "local" | "featured" | "premium";
  name: string;
  price: number;
  duration: string;
  features: string[];
  badge?: string;
}[] = [
  {
    id: "local",
    name: "Local",
    price: 499,
    duration: "per month",
    features: [
      "Local business listing",
      "Category-based placement",
      "Basic analytics",
      "Contact form visibility",
    ],
  },
  {
    id: "featured",
    name: "Featured",
    price: 999,
    duration: "per month",
    features: [
      "Featured card placement",
      "Homepage promotion",
      "Enhanced analytics",
      "Priority category listing",
      "Sponsored badge",
    ],
    badge: "Popular",
  },
  {
    id: "premium",
    name: "Premium",
    price: 1999,
    duration: "per month",
    features: [
      "Premium homepage placement",
      "All category promotions",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom branding options",
      "Priority support",
    ],
    badge: "Best Value",
  },
];

export const CONTACT_UNLOCK_PRICE = 10;
export const CONTACT_UNLOCK_CURRENCY = "INR";

export const PLAN_DURATIONS: Record<string, number> = {
  free: 0,
  basic: 30,
  pro: 30,
  premium: 30,
  local: 30,
  featured: 30,
};

export const DEFAULT_WORKER_PLAN = "free" as const;
export const DEFAULT_CUSTOMER_PLAN = "free" as const;
export const DEFAULT_ADVERTISER_PLAN = "local" as const;
