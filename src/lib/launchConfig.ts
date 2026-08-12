export const LAUNCH_MODE = true;

export const WORKER_TRIAL_DAYS = 30;

export const WORKER_SUBSCRIPTION_PLANS = [
  {
    id: "free" as const,
    name: "Free Trial",
    price: 0,
    duration: `${WORKER_TRIAL_DAYS} days free`,
    features: [
      "Full profile listing",
      "Normal marketplace visibility",
      "Receive booking leads",
      "Basic analytics",
    ],
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 149,
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
    id: "quarterly" as const,
    name: "3 Months",
    price: 399,
    duration: "every 3 months",
    features: [
      "All Monthly features",
      "Better value per month",
      "Priority support",
      "Featured in category",
    ],
    badge: "Save 11%",
  },
  {
    id: "half_yearly" as const,
    name: "6 Months",
    price: 699,
    duration: "every 6 months",
    features: [
      "All Quarterly features",
      "Maximum visibility boost",
      "Dedicated account manager",
      "Premium analytics & reports",
    ],
    badge: "Save 22%",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: 999,
    duration: "per year",
    features: [
      "All Half-Yearly features",
      "Best value per month",
      "Homepage featured placement",
      "Unlimited portfolio images",
      "Direct customer leads",
    ],
    badge: "Best Value",
  },
];

export const CUSTOMER_FREE_CONTACT_UNLOCKS = 3;
export const CONTACT_UNLOCK_PRICE = 10;
export const CONTACT_UNLOCK_CURRENCY = "INR";

export const PLAN_DURATIONS: Record<string, number> = {
  free: WORKER_TRIAL_DAYS,
  monthly: 30,
  quarterly: 90,
  half_yearly: 180,
  yearly: 365,
};

export const DEFAULT_WORKER_PLAN = "free" as const;
export const DEFAULT_CUSTOMER_PLAN = "free" as const;
export const DEFAULT_ADVERTISER_PLAN = "local" as const;

export const CUSTOMER_MEMBERSHIP_PLANS = [
  {
    id: "free" as const,
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
    id: "premium" as const,
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

export const ADVERTISING_PLANS = [
  {
    id: "local" as const,
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
    id: "featured" as const,
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
    id: "premium" as const,
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
