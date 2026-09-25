import { ItineraryData } from "@/types/itinerary";

const STORAGE_KEY = "mapmyescape_saved_itineraries_v1";

/**
 * Retired transport options that were later merged, mapped to their replacement.
 *
 * "Cab / Taxi" and "Self-Drive Car" were two options for the same thing and are
 * now one ("Car / Cab / Taxi"). Itineraries saved before that change still store
 * the old wording, so it is normalised on read — otherwise the timeline's
 * "Transport:" pill would show text the form can no longer produce.
 */
const LEGACY_TRANSPORT_MAP: Record<string, string> = {
  "Cab / Taxi": "Car / Cab / Taxi",
  "Self-Drive Car": "Car / Cab / Taxi",
};

/**
 * Rewrite any retired transport wording to its current equivalent. Accepts the
 * stored form (a `", "`-joined string) and returns the same shape, so callers
 * and the UI are unchanged — only the words differ. Already-current values, and
 * any unknown text, are passed through untouched.
 */
export function normalizeTransport(transport: string): string {
  if (!transport) return transport;
  const mapped = transport
    .split(",")
    .map((mode) => mode.trim())
    .filter(Boolean)
    .map((mode) => LEGACY_TRANSPORT_MAP[mode] ?? mode);
  return [...new Set(mapped)].join(", ");
}

/** Apply the stored-itinerary migrations to a single record. */
function migrateItinerary(itinerary: ItineraryData): ItineraryData {
  const normalized = normalizeTransport(itinerary.transport);
  return normalized === itinerary.transport
    ? itinerary
    : { ...itinerary, transport: normalized };
}

// In-memory cache to guarantee stable reference for useSyncExternalStore / React re-renders
let cachedRaw: string | null = null;
let cachedList: ItineraryData[] = [];
const EMPTY_LIST: ItineraryData[] = [];

// Custom subscriber listeners
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}

export function subscribeToSavedItineraries(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorage = () => {
    cachedRaw = null; // Invalidate cache on external storage event
    callback();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getSavedItinerariesServerSnapshot(): ItineraryData[] {
  return EMPTY_LIST;
}

export function getSavedItineraries(): ItineraryData[] {
  if (typeof window === "undefined") return EMPTY_LIST;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedList;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedList = EMPTY_LIST;
      return cachedList;
    }
    const parsed = JSON.parse(raw);
    cachedList = Array.isArray(parsed)
      ? parsed.map(migrateItinerary)
      : EMPTY_LIST;
    return cachedList;
  } catch (err) {
    console.warn("Error reading saved escapes from localStorage:", err);
    return EMPTY_LIST;
  }
}

export function saveItinerary(itinerary: ItineraryData): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getSavedItineraries();
    // Prevent duplicate entries by ID or title
    const filtered = list.filter(
      (item) =>
        item.id !== itinerary.id && item.tripTitle !== itinerary.tripTitle,
    );
    const updated = [itinerary, ...filtered].slice(0, 20); // Keep up to 20 saved escapes
    const raw = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedList = updated;
    notifyListeners();
    return true;
  } catch (err) {
    console.warn("Error saving escape to localStorage:", err);
    return false;
  }
}

export function removeSavedItinerary(id: string): ItineraryData[] {
  if (typeof window === "undefined") return EMPTY_LIST;
  try {
    const list = getSavedItineraries();
    const updated = list.filter((item) => item.id !== id);
    const raw = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedList = updated;
    notifyListeners();
    return updated;
  } catch (err) {
    console.warn("Error removing escape from localStorage:", err);
    return EMPTY_LIST;
  }
}

export function isItinerarySaved(id: string, tripTitle: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getSavedItineraries();
  return list.some((item) => item.id === id || item.tripTitle === tripTitle);
}
