export interface SearchAnalyticsEvent {
  event: string;
  query?: string;
  resultCount?: number;
  workerId?: string;
  timestamp: number;
  userId?: string;
}

const EVENT_STORAGE_KEY = "kaamwala_search_analytics";
const MAX_STORED_EVENTS = 50;

export function trackSearchEvent(event: Omit<SearchAnalyticsEvent, "timestamp">) {
  if (typeof window === "undefined") return;

  const stored = getStoredEvents();
  const newEvent: SearchAnalyticsEvent = {
    ...event,
    timestamp: Date.now(),
  };

  stored.push(newEvent);
  if (stored.length > MAX_STORED_EVENTS) {
    stored.splice(0, stored.length - MAX_STORED_EVENTS);
  }

  try {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // ignore storage errors
  }
}

export function getStoredEvents(): SearchAnalyticsEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(EVENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EVENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function persistSearchToFirestore(userId: string, query: string, resultCount: number) {
  if (typeof window === "undefined") return;
  
  try {
    const event = {
      query,
      resultCount,
      timestamp: new Date(),
      userId,
    };

    const response = await fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error("Failed to persist search history");
    }
  } catch {
    // silently fail - analytics should not break the app
  }
}
