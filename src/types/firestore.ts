export type UserRole = "customer" | "worker" | "admin";

export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  photoURL?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDoc {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  role: "customer";
  bookings: string[];
  savedWorkers: string[];
  reviewsGiven: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorkerVerificationStatus = "pending" | "under_review" | "verified" | "rejected" | "suspended";

export interface WorkerVerificationDoc {
  id: string;
  workerId: string;
  status: WorkerVerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  documentReferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogDoc {
  id: string;
  adminId: string;
  action: string;
  targetType: "worker" | "advertiser" | "booking" | "user" | "system";
  targetId: string;
  reason?: string;
  createdAt: Date;
}

export interface WorkerDoc {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  photoURL?: string;
  role: "worker";

  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
  };

  professionalInfo: {
    profession: string;
    experience: number;
    hourlyRate: number;
    minVisitCharge?: number;
    description: string;
    skills: string[];
    languages: string[];
    category: string;
  };

  documents: {
    aadhaar?: { url: string; uploadedAt: Date };
    pan?: { url: string; uploadedAt: Date };
    profilePhoto?: { url: string; uploadedAt: Date };
    experienceCert?: { url: string; uploadedAt: Date };
    policeVerification?: { url: string; uploadedAt: Date };
  };

  availability: {
    serviceRadius: number;
    availableDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    emergencyService: boolean;
    homeVisit: boolean;
  };

  serviceArea: {
    state: string;
    city: string;
    pincode: string;
    area?: string;
    latitude?: number;
    longitude?: number;
    locationUpdatedAt?: Date;
  };

  verificationStatus: WorkerVerificationStatus;
  verificationDocuments?: {
    identityProof?: { url: string; uploadedAt: Date };
    skillProof?: { url: string; uploadedAt: Date };
    experienceProof?: { url: string; uploadedAt: Date };
  };
  suspension?: {
    suspendedAt: Date;
    suspendedBy: string;
    reason: string;
  };
  rating: number;
  reviewCount: number;
  reviews: string[];
  isAvailable: boolean;
  isVerified: boolean;
  joinedDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingDoc {
  id: string;
  customerId: string;
  workerId: string;
  customerName?: string;
  workerName: string;
  workerImage: string;
  service: string;
  description?: string;
  date: string;
  time?: string;
  address?: string;
  landmark?: string;
  notes?: string;
  duration?: string;
  status: "pending" | "accepted" | "rejected" | "confirmed" | "in-progress" | "completed" | "cancelled";
  totalAmount: number;
  amount: number;
  earnings?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDoc {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "pending";
  method: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: Date;
}

export interface CategoryDoc {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  workerCount: number;
  image: string;
  createdAt: Date;
}

export interface CityDoc {
  id: string;
  name: string;
  state: string;
  slug: string;
  active: boolean;
  createdAt: Date;
}

export type NotificationType =
  | "booking_created"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "review_received"
  | "subscription_updated"
  | "membership_updated"
  | "contact_unlocked"
  | "advertisement_updated"
  | "payment_received"
  | "system";

export interface NotificationDoc {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  read: boolean;
  createdAt: Date;
}

 export interface AdminStats {
   totalUsers: number;
   totalWorkers: number;
   verifiedWorkers: number;
   pendingVerifications: number;
   activeBookings: number;
   completedBookings: number;
   totalTransactions: number;
   activeAdvertisements: number;
 }
