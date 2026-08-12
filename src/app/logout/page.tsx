"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/authService";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      await logoutUser();
      router.push("/login");
    };

    doLogout();
  }, [router]);

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-text-secondary">Signing out...</p>
      </div>
    </main>
  );
}
