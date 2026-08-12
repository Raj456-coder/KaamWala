"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserRole } from "@/types/firestore";
import { getUserRole } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  error: null,
});

export const useAuthContext = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      console.error("[AuthProvider] Firebase auth is not initialized — auth is null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    console.log("[AuthProvider] Initializing auth state listener");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthProvider] Auth state changed:", firebaseUser?.uid || "signed out");
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userRole = await getUserRole(firebaseUser.uid);
          console.log("[AuthProvider] User role:", userRole);
          setRole(userRole);
        } catch (roleError) {
          console.error("[AuthProvider] Failed to fetch user role:", roleError);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
