import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WorkerDoc, CategoryDoc, CityDoc, CustomerDoc, AdminStats, FirestoreUser, BookingDoc } from "@/types/firestore";
import { WorkerProfile, Review } from "@/types";
import { slugify, sanitizeForFirestore } from "@/lib/utils";
import { Coordinates, haversineDistance, formatDistance as formatDistanceKm } from "@/lib/location";

export interface FirestoreWorker extends WorkerDoc {
  id: string;
}

export interface FirestoreCategory extends CategoryDoc {
  id: string;
}

export interface FirestoreCity extends CityDoc {
  id: string;
}

export interface MapWorkerParams {
  keyword?: string;
  profession?: string;
  category?: string;
  city?: string;
  state?: string;
  minRating?: number;
  maxRating?: number;
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  isAvailable?: boolean;
  sortBy?: "rating" | "distance" | "price" | "experience" | "newest";
  limit?: number;
  cursor?: QueryDocumentSnapshot<DocumentData, DocumentData>;
}

export function mapFirestoreWorkerToProfile(
  worker: WorkerWithId,
  userCoords?: Coordinates
): WorkerProfile {
  const {
    id,
    name,
    personalInfo,
    professionalInfo,
    rating,
    reviewCount,
    serviceArea,
    availability,
    documents,
    joinedDate,
    isVerified,
    isAvailable,
    photoURL,
  } = worker;

  const location = serviceArea
    ? `${serviceArea.city}, ${serviceArea.state}`
    : "Location not set";

  let distance = "N/A";
  let distanceKm = Infinity;

  if (userCoords && serviceArea?.latitude && serviceArea?.longitude) {
    distanceKm = haversineDistance(userCoords, {
      latitude: serviceArea.latitude,
      longitude: serviceArea.longitude,
    });
    distance = formatDistanceKm(distanceKm);
  } else if (availability?.serviceRadius) {
    distance = `${availability.serviceRadius} km`;
  }

  const image = photoURL || documents?.profilePhoto?.url || "";

  const availabilityStr = availability
    ? `${availability.availableDays.join(", ") || "Not set"} · ${availability.workingHours.start} - ${availability.workingHours.end}`
    : "Not set";

  const portfolioImages: string[] = [];
  if (documents?.profilePhoto?.url) portfolioImages.push(documents.profilePhoto.url);

  const reviews: Review[] = [];

  return {
    id,
    name: name || "",
    category: professionalInfo?.category || professionalInfo?.profession || "",
    categorySlug: slugify(professionalInfo?.category || professionalInfo?.profession || ""),
    rating: rating || 0,
    reviewCount: reviewCount || 0,
    experience: professionalInfo?.experience || 0,
    distance,
    hourlyRate: professionalInfo?.hourlyRate || 0,
    minVisitCharge: professionalInfo?.minVisitCharge,
    isVerified: isVerified || false,
    isAvailable: isAvailable || false,
    image,
    location,
    skills: professionalInfo?.skills || [],
    description: professionalInfo?.description || "",
    languages: professionalInfo?.languages || [],
    availability: availabilityStr,
    joinedDate: joinedDate || "",
    portfolioImages,
    reviews,
    latitude: serviceArea?.latitude,
    longitude: serviceArea?.longitude,
    phoneNumber: personalInfo?.phone,
  };
}

export function mapWorkerDocsToProfiles(
  workers: WorkerWithId[],
  userCoords?: Coordinates,
): WorkerProfile[] {
  return workers.map((w) => mapFirestoreWorkerToProfile(w, userCoords));
}

export interface WorkerWithId extends WorkerDoc {
  id: string;
}

export interface CategoryWithId extends CategoryDoc {
  id: string;
}

export interface CityWithId extends CityDoc {
  id: string;
}

export interface CustomerWithId extends CustomerDoc {
  id: string;
}

export interface SearchParams {
  keyword?: string;
  profession?: string;
  category?: string;
  city?: string;
  state?: string;
  minRating?: number;
  maxRating?: number;
  minExperience?: number;
  maxExperience?: number;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  isAvailable?: boolean;
  sortBy?: "rating" | "distance" | "price" | "experience" | "newest";
  limit?: number;
  cursor?: QueryDocumentSnapshot<DocumentData, DocumentData>;
}

export async function saveWorkerProfile(
  workerData: Omit<WorkerDoc, "createdAt" | "updatedAt">
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const workerRef = doc(db, "workers", workerData.uid);
    const now = new Date();
    await setDoc(workerRef, sanitizeForFirestore({
      ...workerData,
      createdAt: now,
      updatedAt: now,
    }));
    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to save worker profile." };
  }
}

export async function getWorkerById(id: string): Promise<{ worker: WorkerWithId | null; error: string | null }> {
  if (!db) {
    return { worker: null, error: "Firestore is not available." };
  }

  try {
    const workerDoc = await getDoc(doc(db, "workers", id));
    if (!workerDoc.exists()) {
      return { worker: null, error: "Worker not found." };
    }
    const data = workerDoc.data() as WorkerDoc;
    return { worker: { id: workerDoc.id, ...data }, error: null };
  } catch (error: unknown) {
    return { worker: null, error: (error as Error).message || "Failed to fetch worker." };
  }
}

export async function searchWorkers(
  params: SearchParams = {}
): Promise<{ workers: WorkerWithId[]; hasMore: boolean; lastDoc: QueryDocumentSnapshot | null; error: string | null }> {
    if (!db) {
    return { workers: [], hasMore: false, lastDoc: null, error: "Firestore is not available." };
  }

  try {
    let q = query(collection(db, "workers"));

    if (params.verifiedOnly) {
      q = query(q, where("isVerified", "==", true));
    }
    if (params.isAvailable) {
      q = query(q, where("isAvailable", "==", true));
    }
    q = query(q, where("verificationStatus", "not-in", ["suspended", "rejected"]));
    if (params.category) {
      q = query(q, where("professionalInfo.category", "==", params.category));
    }
    if (params.minRating !== undefined) {
      q = query(q, where("rating", ">=", params.minRating));
    }
    if (params.maxRating !== undefined) {
      q = query(q, where("rating", "<=", params.maxRating));
    }
    if (params.minPrice !== undefined) {
      q = query(q, where("professionalInfo.hourlyRate", ">=", params.minPrice));
    }
    if (params.maxPrice !== undefined) {
      q = query(q, where("professionalInfo.hourlyRate", "<=", params.maxPrice));
    }
    if (params.minExperience !== undefined) {
      q = query(q, where("professionalInfo.experience", ">=", params.minExperience));
    }
    if (params.maxExperience !== undefined) {
      q = query(q, where("professionalInfo.experience", "<=", params.maxExperience));
    }

    const sortFieldMap: Record<string, string> = {
      rating: "rating",
      price: "professionalInfo.hourlyRate",
      experience: "professionalInfo.experience",
      newest: "createdAt",
    };
    const sortField = sortFieldMap[params.sortBy || "rating"] || "rating";
    const sortDir = params.sortBy === "price" ? "asc" : "desc";
    q = query(q, orderBy(sortField, sortDir));

    const pageSize = params.limit || 12;
    q = query(q, limit(pageSize + 1));

    if (params.cursor) {
      q = query(q, startAfter(params.cursor));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    let workers: WorkerWithId[] = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...(doc.data() as WorkerDoc),
    }));

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      workers = workers.filter(
        (w) =>
          w.name.toLowerCase().includes(kw) ||
          w.professionalInfo?.profession?.toLowerCase().includes(kw) ||
          w.professionalInfo?.category?.toLowerCase().includes(kw) ||
          w.professionalInfo?.skills?.some((s) => s.toLowerCase().includes(kw)) ||
          w.professionalInfo?.description?.toLowerCase().includes(kw)
      );
    }

    if (params.city) {
      const cityLower = params.city.toLowerCase();
      workers = workers.filter(
        (w) =>
          w.serviceArea?.city?.toLowerCase().includes(cityLower) ||
          w.serviceArea?.state?.toLowerCase().includes(cityLower)
      );
    }

    if (params.state) {
      const stateLower = params.state.toLowerCase();
      workers = workers.filter((w) => w.serviceArea?.state?.toLowerCase().includes(stateLower));
    }

    return {
      workers,
      hasMore: hasMore && workers.length === pageSize,
      lastDoc: hasMore ? docs[pageSize - 1] : null,
      error: null,
    };
  } catch (error: unknown) {
    return { workers: [], hasMore: false, lastDoc: null, error: (error as Error).message || "Failed to search workers." };
  }
}

export async function searchNearbyWorkers(
  params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    category?: string;
    verifiedOnly?: boolean;
    isAvailable?: boolean;
    minRating?: number;
    sortBy?: "distance" | "rating" | "price" | "experience";
    limit?: number;
  }
): Promise<{ workers: WorkerWithId[]; error: string | null }> {
  if (!db) {
    return { workers: [], error: "Firestore is not available." };
  }

  try {
    let q = query(collection(db, "workers"));

    if (params.verifiedOnly) {
      q = query(q, where("isVerified", "==", true));
    }
    if (params.isAvailable) {
      q = query(q, where("isAvailable", "==", true));
    }
    if (params.category) {
      q = query(q, where("professionalInfo.category", "==", params.category));
    }
    if (params.minRating !== undefined) {
      q = query(q, where("rating", ">=", params.minRating));
    }

    const snapshot = await getDocs(q);
    const workers: WorkerWithId[] = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as WorkerDoc) }))
      .filter((w) => {
        const lat = w.serviceArea?.latitude;
        const lng = w.serviceArea?.longitude;
        if (lat == null || lng == null) return false;
        const distance = haversineDistance(
          { latitude: params.latitude, longitude: params.longitude },
          { latitude: lat, longitude: lng }
        );
        const radius = params.radiusKm ?? 25;
        return distance <= radius;
      });

    const userCoords: Coordinates = {
      latitude: params.latitude,
      longitude: params.longitude,
    };

    workers.sort((a, b) => {
      const distA = haversineDistance(userCoords, {
        latitude: a.serviceArea!.latitude!,
        longitude: a.serviceArea!.longitude!,
      });
      const distB = haversineDistance(userCoords, {
        latitude: b.serviceArea!.latitude!,
        longitude: b.serviceArea!.longitude!,
      });

      switch (params.sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0) || distA - distB;
        case "price":
          return (a.professionalInfo?.hourlyRate || 0) - (b.professionalInfo?.hourlyRate || 0);
        case "experience":
          return (b.professionalInfo?.experience || 0) - (a.professionalInfo?.experience || 0);
        case "distance":
        default:
          return distA - distB;
      }
    });

    const limit = params.limit || workers.length;
    return { workers: workers.slice(0, limit), error: null };
  } catch (error: unknown) {
    return { workers: [], error: (error as Error).message || "Failed to find nearby workers." };
  }
}

export async function getCategories(): Promise<{ categories: CategoryWithId[]; error: string | null }> {
  if (!db) {
    return { categories: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(collection(db, "categories"));
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CategoryDoc, "id">),
    }));
    return { categories, error: null };
  } catch (error: unknown) {
    return { categories: [], error: (error as Error).message || "Failed to fetch categories." };
  }
}

export async function getCities(): Promise<{ cities: CityWithId[]; error: string | null }> {
  if (!db) {
    return { cities: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "cities"), where("active", "==", true), orderBy("name"))
    );
    const cities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CityDoc, "id">),
    }));
    return { cities, error: null };
  } catch (error: unknown) {
    return { cities: [], error: (error as Error).message || "Failed to fetch cities." };
  }
}

export async function getFeaturedWorkers(count: number = 6): Promise<{ workers: WorkerWithId[]; error: string | null }> {
  if (!db) {
    return { workers: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "workers"), where("isVerified", "==", true), orderBy("rating", "desc"), limit(count))
    );
    const workers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WorkerDoc),
    }));
    return { workers, error: null };
  } catch (error: unknown) {
    return { workers: [], error: (error as Error).message || "Failed to fetch workers." };
  }
}

export async function updateWorkerAvailability(
  workerId: string,
  isAvailable: boolean
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    await updateDoc(doc(db, "workers", workerId), sanitizeForFirestore({
      isAvailable,
      updatedAt: new Date(),
    }));
    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to update availability." };
  }
}

export async function saveWorker(
  customerId: string,
  workerId: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const customerRef = doc(db, "customers", customerId);
    await updateDoc(customerRef, sanitizeForFirestore({
      savedWorkers: arrayUnion(workerId),
      updatedAt: new Date(),
    }));
    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to save worker." };
  }
}

export async function removeSavedWorker(
  customerId: string,
  workerId: string
): Promise<{ error: string | null }> {
  if (!db) {
    return { error: "Firestore is not available." };
  }

  try {
    const customerRef = doc(db, "customers", customerId);
    await updateDoc(customerRef, sanitizeForFirestore({
      savedWorkers: arrayRemove(workerId),
      updatedAt: new Date(),
    }));
    return { error: null };
  } catch (error: unknown) {
    return { error: (error as Error).message || "Failed to remove saved worker." };
  }
}

export async function getCustomerById(
  customerId: string
): Promise<{ customer: CustomerWithId | null; error: string | null }> {
  if (!db) {
    return { customer: null, error: "Firestore is not available." };
  }

  try {
    const customerDoc = await getDoc(doc(db, "customers", customerId));
    if (!customerDoc.exists()) {
      return { customer: null, error: "Customer not found." };
    }
    const data = customerDoc.data() as CustomerDoc;
    return { customer: { id: customerDoc.id, ...data }, error: null };
  } catch (error: unknown) {
    return { customer: null, error: (error as Error).message || "Failed to fetch customer." };
  }
}

export async function getSavedWorkers(
  customerId: string
): Promise<{ workers: FirestoreWorker[]; error: string | null }> {
  if (!db) {
    return { workers: [], error: "Firestore is not available." };
  }

  try {
    const customerDoc = await getDoc(doc(db, "customers", customerId));
    if (!customerDoc.exists()) {
      return { workers: [], error: null };
    }

    const customerData = customerDoc.data() as CustomerDoc;
    const savedWorkerIds = customerData.savedWorkers || [];

    if (savedWorkerIds.length === 0) {
      return { workers: [], error: null };
    }

    const workers: FirestoreWorker[] = [];
    for (const workerId of savedWorkerIds) {
      const workerResult = await getWorkerById(workerId);
      if (workerResult.worker) {
        workers.push(workerResult.worker);
      }
    }

    return { workers, error: null };
  } catch (error: unknown) {
    return { workers: [], error: (error as Error).message || "Failed to fetch saved workers." };
  }
}

export async function getAdminStats(): Promise<{ stats: AdminStats; error: string | null }> {
  if (!db) {
    return { stats: { totalUsers: 0, totalWorkers: 0, verifiedWorkers: 0, pendingVerifications: 0, activeBookings: 0, completedBookings: 0, totalTransactions: 0, activeAdvertisements: 0 }, error: "Firestore is not available." };
  }

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const workersSnap = await getDocs(collection(db, "workers"));
    const bookingsSnap = await getDocs(collection(db, "bookings"));
    const pendingSnap = await getDocs(
      query(collection(db, "workers"), where("verificationStatus", "==", "pending"))
    );
    const verifiedSnap = await getDocs(
      query(collection(db, "workers"), where("isVerified", "==", true))
    );
    const activeBookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("status", "in", ["pending", "accepted", "confirmed", "in-progress"]))
    );
    const completedBookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("status", "==", "completed"))
    );
    const transactionsSnap = await getDocs(collection(db, "transactions"));
    const activeAdvertisementsSnap = await getDocs(
      query(collection(db, "advertisers"), where("status", "==", "active"))
    );

    return {
      stats: {
        totalUsers: usersSnap.size,
        totalWorkers: workersSnap.size,
        verifiedWorkers: verifiedSnap.size,
        pendingVerifications: pendingSnap.size,
        activeBookings: activeBookingsSnap.size,
        completedBookings: completedBookingsSnap.size,
        totalTransactions: transactionsSnap.size,
        activeAdvertisements: activeAdvertisementsSnap.size,
      },
      error: null,
    };
  } catch (error: unknown) {
    return { stats: { totalUsers: 0, totalWorkers: 0, verifiedWorkers: 0, pendingVerifications: 0, activeBookings: 0, completedBookings: 0, totalTransactions: 0, activeAdvertisements: 0 }, error: (error as Error).message || "Failed to load admin stats." };
  }
}

export async function getRecentUsers(limitCount: number = 10): Promise<{ users: FirestoreUser[]; error: string | null }> {
  if (!db) {
    return { users: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "users"), orderBy("createdAt", "desc"), limit(limitCount))
    );
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<FirestoreUser, "uid">),
    }));
    return { users, error: null };
  } catch (error: unknown) {
    return { users: [], error: (error as Error).message || "Failed to load recent users." };
  }
}

export async function getAllWorkers(limitCount: number = 100): Promise<{ workers: WorkerWithId[]; error: string | null }> {
  if (!db) {
    return { workers: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "workers"), orderBy("createdAt", "desc"), limit(limitCount))
    );
    const workers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WorkerDoc),
    }));
    return { workers, error: null };
  } catch (error: unknown) {
    return { workers: [], error: (error as Error).message || "Failed to load workers." };
  }
}

export async function getAllBookings(limitCount: number = 100): Promise<{ bookings: BookingDoc[]; error: string | null }> {
  if (!db) {
    return { bookings: [], error: "Firestore is not available." };
  }

  try {
    const snapshot = await getDocs(
      query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(limitCount))
    );
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<BookingDoc, "id">),
    }));
    return { bookings, error: null };
  } catch (error: unknown) {
    return { bookings: [], error: (error as Error).message || "Failed to load bookings." };
  }
}
