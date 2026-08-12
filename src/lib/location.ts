export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  city: string;
  state: string;
  pincode: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: Date;
}

export function haversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function getDistanceBucket(km: number): string {
  if (km <= 2) return "within-2km";
  if (km <= 5) return "within-5km";
  if (km <= 10) return "within-10km";
  return "within-25km";
}

export function parseLocationQuery(query: string): {
  keyword: string;
  city?: string;
  state?: string;
  area?: string;
  nearby: boolean;
} {
  const trimmed = query.trim();
  const nearby = /\b(near\s*me|nearby|near\s+my\s+location)\b/i.test(trimmed);
  const inMatch = trimmed.match(/\bin\s+([A-Za-z\s]+?)(?:\s+near\b|\s+within\b|$)/i);
  const nearMatch = trimmed.match(/near\s+([A-Za-z\s]+?)(?:\s+within\b|$)/i);

  let city: string | undefined;
  let area: string | undefined;
  let state: string | undefined;

  if (inMatch) {
    const loc = inMatch[1].trim();
    if (loc.length > 2) {
      city = loc;
    }
  }

  if (nearMatch && !city) {
    const loc = nearMatch[1].trim();
    if (loc.length > 2) {
      area = loc;
      city = loc;
    }
  }

  const cleanQuery = trimmed
    .replace(/\b(near\s*me|nearby|near\s+my\s+location)\b/gi, "")
    .replace(/\bwithin\s+\d+\s*km\b/gi, "")
    .replace(/\bin\s+[A-Za-z\s]+?\b/gi, "")
    .replace(/\bnear\s+[A-Za-z\s]+?\b/gi, "")
    .trim();

  return {
    keyword: cleanQuery || trimmed,
    city,
    state,
    area,
    nearby,
  };
}

export function getBrowserGeolocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location unavailable"));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out"));
            break;
          default:
            reject(new Error("Unable to retrieve location"));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}
