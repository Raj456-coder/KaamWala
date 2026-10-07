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

export const KNOWN_CITY_COORDINATES: Record<string, Coordinates> = {
  mathura: { latitude: 27.4924, longitude: 77.6737 },
  vrindavan: { latitude: 27.5806, longitude: 77.7006 },
  agra: { latitude: 27.1767, longitude: 78.0081 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  "new delhi": { latitude: 28.6139, longitude: 77.209 },
  noida: { latitude: 28.5355, longitude: 77.391 },
  "greater noida": { latitude: 28.4744, longitude: 77.504 },
  gurgaon: { latitude: 28.4595, longitude: 77.0266 },
  gurugram: { latitude: 28.4595, longitude: 77.0266 },
  faridabad: { latitude: 28.4089, longitude: 77.3178 },
  ghaziabad: { latitude: 28.6692, longitude: 77.4538 },
  lucknow: { latitude: 26.8467, longitude: 80.9462 },
  kanpur: { latitude: 26.4499, longitude: 80.3319 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  chandigarh: { latitude: 30.7333, longitude: 76.7794 },
  varanasi: { latitude: 25.3176, longitude: 82.9739 },
  prayagraj: { latitude: 25.4358, longitude: 81.8463 },
  allahabad: { latitude: 25.4358, longitude: 81.8463 },
  aligarh: { latitude: 27.8974, longitude: 78.088 },
  meerut: { latitude: 28.9845, longitude: 77.7064 },
  bareilly: { latitude: 28.367, longitude: 79.4304 },
  patna: { latitude: 25.5941, longitude: 85.1376 },
  bhopal: { latitude: 23.2599, longitude: 77.4126 },
  indore: { latitude: 22.7196, longitude: 75.8577 },
};

export function getCityCoordinates(cityName?: string | null): Coordinates | null {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  if (KNOWN_CITY_COORDINATES[normalized]) {
    return KNOWN_CITY_COORDINATES[normalized];
  }
  for (const [city, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }
  return null;
}
