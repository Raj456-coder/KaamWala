"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole, FirestoreUser } from "@/types/firestore";
import { getUserProfile, getUserRole } from "@/services/authService";

export interface AuthContextType {
  user: User | null;
  profile: FirestoreUser | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  refreshRole: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  error: null,
  refreshRole: async () => {},
  refreshProfile: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FirestoreUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(auth));
  const [error, setError] = useState<string | null>(null);

  const fetchProfileAndRole = useCallback(async (uid: string) => {
    try {
      const [userProfile, userRole] = await Promise.all([
        getUserProfile(uid),
        getUserRole(uid),
      ]);
      setProfile(userProfile);
      setRole(userRole || userProfile?.role || null);
    } catch (err) {
      console.error("[AuthProvider] Error fetching profile/role:", err);
      setError("Failed to fetch user data.");
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (!auth) return;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setRole(null);
      setProfile(null);
      return;
    }
    await fetchProfileAndRole(currentUser.uid);
  }, [fetchProfileAndRole]);

  const refreshProfile = useCallback(async () => {
    await refreshRole();
  }, [refreshRole]);

  useEffect(() => {
    if (!auth) {
      console.error("[AuthProvider] Firebase auth is not initialized — auth is null");
      return;
    }

    console.log("[AuthProvider] Initializing auth state listener");

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthProvider] Auth state changed:", firebaseUser?.uid || "signed out");
      setUser(firebaseUser);

      // Clean up previous snapshot listener if user changed
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        if (!db) {
          console.warn("[AuthProvider] db is not initialized");
          setLoading(false);
          return;
        }

        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          unsubUserDoc = onSnapshot(
            userRef,
            async (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as FirestoreUser;
                setProfile(data);
                setRole(data.role || null);
              } else {
                // If users/{uid} is not yet created, perform fallback lookup
                const fallbackRole = await getUserRole(firebaseUser.uid);
                setRole(fallbackRole);
                setProfile(null);
              }
              setLoading(false);
            },
            async (snapshotError) => {
              console.error("[AuthProvider] Realtime user doc listener error:", snapshotError);
              await fetchProfileAndRole(firebaseUser.uid);
              setLoading(false);
            }
          );
        } catch (listenerError) {
          console.error("[AuthProvider] Failed to attach snapshot listener:", listenerError);
          await fetchProfileAndRole(firebaseUser.uid);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth and profile listeners");
      unsubscribeAuth();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, [fetchProfileAndRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        error,
        refreshRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
