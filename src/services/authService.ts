import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole, FirestoreUser, CustomerDoc, WorkerDoc } from "@/types/firestore";
import { sanitizeForFirestore } from "@/lib/utils";

export interface AuthError {
  code: string;
  message: string;
}

export const getFriendlyAuthError = (error: { code: string; message: string }): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please login instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password. Please try again.";
    case "auth/user-disabled":
      return "Your account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/missing-android-credential":
    case "auth/missing-ios-credential":
      return "Configuration error. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  phone?: string,
  city?: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  console.log("[Auth] registerUser called:", { email, name, role });
  if (!auth || !db) {
    console.error("[Auth] registerUser failed: auth or db is null");
    return {
      user: null,
      error: { code: "auth/unavailable", message: "Authentication service is not available." },
    };
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      password
    );

    const user = userCredential.user;
    console.log("[Auth] User created:", user.uid);

    await updateProfile(user, {
      displayName: trimmedName,
    });

    const now = new Date();
    const sanitizedEmail = trimmedEmail || "";

    const userData: FirestoreUser = {
      uid: user.uid,
      email: sanitizedEmail,
      name: trimmedName,
      role,
      phone: phone || "",
      city: city || "",
      createdAt: now,
      updatedAt: now,
    };

    const customerDoc: CustomerDoc = {
      uid: user.uid,
      email: sanitizedEmail,
      name: trimmedName,
      phone: phone || "",
      role: "customer",
      bookings: [],
      savedWorkers: [],
      reviewsGiven: [],
      createdAt: now,
      updatedAt: now,
    };

    const workerDoc: WorkerDoc = {
      uid: user.uid,
      email: sanitizedEmail,
      name: trimmedName,
      phone: phone || "",
      role: "worker",
      personalInfo: {
        fullName: trimmedName,
        email: sanitizedEmail || "",
        phone: phone || "",
      },
      professionalInfo: {
        profession: "",
        experience: 0,
        hourlyRate: 0,
        description: "",
        skills: [],
        languages: [],
        category: "",
      },
      documents: {},
      availability: {
        serviceRadius: 10,
        availableDays: [],
        workingHours: { start: "09:00", end: "18:00" },
        emergencyService: false,
        homeVisit: false,
      },
      serviceArea: {
        state: city?.split(",").pop()?.trim() || "",
        city: city?.split(",").shift()?.trim() || "",
        pincode: "",
      },
      verificationStatus: "pending",
      rating: 0,
      reviewCount: 0,
      reviews: [],
      isAvailable: false,
      isVerified: false,
      joinedDate: now.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    await runTransaction(db!, async (transaction) => {
      const userRef = doc(db!, "users", user.uid);
      transaction.set(userRef, sanitizeForFirestore(userData));

      if (role === "customer") {
        const customerRef = doc(db!, "customers", user.uid);
        transaction.set(customerRef, sanitizeForFirestore(customerDoc));
      } else if (role === "worker") {
        const workerRef = doc(db!, "workers", user.uid);
        transaction.set(workerRef, sanitizeForFirestore(workerDoc));
      }
    });

    return { user, error: null };
  } catch (error: unknown) {
    console.error("[Auth] registerUser error:", error);
    const err = error as Error & { code?: string };
    const friendlyMessage = getFriendlyAuthError({ code: err.code || "", message: err.message || "Registration failed" });
    
    if (err.code === "auth/email-already-in-use") {
      return {
        user: null,
        error: {
          code: err.code || "auth/email-already-in-use",
          message: friendlyMessage,
        },
      };
    }
    
    return {
      user: null,
      error: {
        code: err.code || "unknown",
        message: friendlyMessage,
      },
    };
  }
};

export const syncUserProfile = async (
  uid: string,
  updates: Partial<FirestoreUser>
): Promise<{ error: AuthError | null }> => {
  if (!db) {
    return { error: { code: "auth/unavailable", message: "Service not available." } };
  }

  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const now = new Date();
      const newUser: FirestoreUser = {
        uid,
        email: updates.email || "",
        name: updates.name || "",
        role: updates.role || "customer",
        phone: updates.phone || "",
        city: updates.city || "",
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, sanitizeForFirestore(newUser));
      return { error: null };
    }

    const sanitizedUpdates = sanitizeForFirestore({ ...updates, updatedAt: new Date() });
    await updateDoc(userRef, sanitizedUpdates as Partial<FirestoreUser>);
    return { error: null };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    return {
      error: {
        code: err.code || "unknown",
        message: err.message || "Profile sync failed",
      },
    };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: User; error: AuthError | null }> => {
  console.log("[Auth] loginUser called:", { email });
  if (!auth) {
    console.error("[Auth] loginUser failed: auth is null");
    return {
      user: null as unknown as User,
      error: { code: "auth/unavailable", message: "Authentication service is not available." },
    };
  }

  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    console.log("[Auth] Login successful:", userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    console.error("[Auth] loginUser error:", error);
    const err = error as Error & { code?: string };
    return {
      user: null as unknown as User,
      error: {
        code: err.code || "unknown",
        message: getFriendlyAuthError({ code: err.code || "", message: err.message || "" }),
      },
    };
  }
};

export const logoutUser = async (): Promise<{ error: AuthError | null }> => {
  console.log("[Auth] logoutUser called");
  if (!auth) {
    console.log("[Auth] logoutUser: auth is null, nothing to logout");
    return { error: null };
  }

  try {
    await signOut(auth);
    console.log("[Auth] Logout successful");
    return { error: null };
  } catch (error: unknown) {
    console.error("[Auth] logoutUser error:", error);
    const err = error as Error & { code?: string };
    return {
      error: {
        code: err.code || "unknown",
        message: err.message || "Logout failed. Please try again.",
      },
    };
  }
};

export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  if (!auth) {
    return { error: { code: "auth/unavailable", message: "Authentication service is not available." } };
  }

  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return { error: null };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    return {
      error: {
        code: err.code || "unknown",
        message: getFriendlyAuthError({ code: err.code || "", message: err.message || "" }),
      },
    };
  }
};

export const getUserProfile = async (uid: string): Promise<FirestoreUser | null> => {
  if (!db) return null;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as FirestoreUser;
  } catch (error) {
    console.error("[Auth] getUserProfile error:", error);
    return null;
  }
};

export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  if (!db) return null;

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as FirestoreUser;
      if (data.role) return data.role;
    }
    const customerDoc = await getDoc(doc(db, "customers", uid));
    if (customerDoc.exists()) return "customer";
    const workerDoc = await getDoc(doc(db, "workers", uid));
    if (workerDoc.exists()) return "worker";
    return null;
  } catch (error) {
    console.error("[Auth] getUserRole error:", error);
    return null;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<FirestoreUser>
): Promise<{ error: AuthError | null }> => {
  if (!db) {
    return { error: { code: "auth/unavailable", message: "Service not available." } };
  }

  try {
    const now = new Date();
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    const role: UserRole = updates.role || userDoc.data()?.role || "customer";

    if (!userDoc.exists()) {
      // Defensive: create the user document if it is somehow missing.
      const newUser: FirestoreUser = {
        uid,
        email: updates.email || "",
        name: updates.name || "",
        role,
        phone: updates.phone || "",
        city: updates.city || "",
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, sanitizeForFirestore(newUser));
    } else {
      const sanitizedUpdates = sanitizeForFirestore({ ...updates, updatedAt: now });
      await updateDoc(userRef, sanitizedUpdates as Partial<FirestoreUser>);
    }

    // Keep the role-specific document in sync so dashboards and entitlements
    // (e.g. customer free-contact unlocks, worker profile) resolve correctly.
    if (role === "customer") {
      const customerRef = doc(db, "customers", uid);
      const base: CustomerDoc = {
        uid,
        email: updates.email || userDoc.data()?.email || "",
        name: updates.name || userDoc.data()?.name || "",
        phone: updates.phone || userDoc.data()?.phone || "",
        role: "customer",
        bookings: [],
        savedWorkers: [],
        reviewsGiven: [],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(customerRef, sanitizeForFirestore(base), { merge: true });
    } else if (role === "worker") {
      const workerRef = doc(db, "workers", uid);
      await setDoc(
        workerRef,
        sanitizeForFirestore(buildWorkerDoc(uid, {
          name: updates.name || userDoc.data()?.name || "",
          email: updates.email || userDoc.data()?.email || "",
          phone: updates.phone || userDoc.data()?.phone || "",
          city: updates.city || userDoc.data()?.city || "",
        })),
        { merge: true }
      );
    }

    return { error: null };
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    return {
      error: {
        code: err.code || "unknown",
        message: err.message || "Update failed",
      },
    };
  }
};

// Builds a valid WorkerDoc shape used both for registration and for creating
// the worker document when a user selects the "worker" role. `merge: true`
// ensures it never overwrites an existing, partially completed profile.
function buildWorkerDoc(
  uid: string,
  info: { name: string; email: string; phone: string; city?: string }
): WorkerDoc {
  const now = new Date();
  const cityParts = (info.city || "").split(",").map((p) => p.trim());
  return {
    uid,
    email: info.email || "",
    name: info.name || "",
    phone: info.phone || "",
    role: "worker",
    personalInfo: {
      fullName: info.name || "",
      email: info.email || "",
      phone: info.phone || "",
      address: "",
    },
    professionalInfo: {
      profession: "",
      experience: 0,
      hourlyRate: 0,
      description: "",
      skills: [],
      languages: [],
      category: "",
    },
    documents: {},
    availability: {
      serviceRadius: 10,
      availableDays: [],
      workingHours: { start: "09:00", end: "18:00" },
      emergencyService: false,
      homeVisit: false,
    },
    serviceArea: {
      state: cityParts[1] || "",
      city: cityParts[0] || "",
      pincode: "",
    },
    verificationStatus: "pending",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    isAvailable: false,
    isVerified: false,
    joinedDate: now.toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}
