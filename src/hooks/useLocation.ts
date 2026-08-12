"use client";

import { useState, useCallback } from "react";
import { getBrowserGeolocation } from "@/lib/location";

export interface CustomerLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  area?: string;
}

export type LocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "unavailable"
  | "unsupported";

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    setStatus("loading");
    setError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Location is not supported by your browser.");
      return;
    }

    try {
      const coords = await getBrowserGeolocation();
      setLocation({
        ...coords,
        city: undefined,
        state: undefined,
        area: undefined,
      });
      setStatus("granted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to retrieve location.";
      setError(message);
      if (message.includes("denied")) {
        setStatus("denied");
      } else if (message.includes("unavailable") || message.includes("timed out")) {
        setStatus("unavailable");
      } else {
        setStatus("unsupported");
      }
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    location,
    status,
    error,
    detectLocation,
    clearLocation,
  };
}
