"use client";

import { useAuthContext } from "@/context/AuthContext";

export function useAuth() {
  const context = useAuthContext();
  return {
    user: context.user,
    profile: context.profile,
    role: context.role,
    loading: context.loading,
    error: context.error,
    refreshRole: context.refreshRole,
    refreshProfile: context.refreshProfile,
  };
}

export default useAuth;

