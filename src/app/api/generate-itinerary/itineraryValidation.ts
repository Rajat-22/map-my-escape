import { DayPlan, ItineraryStop, TripRequest } from "@/types/itinerary";
import { itineraryConfig } from "./config";

/**
 * Pure helpers for turning raw request/form input and raw model output into a
 * shape the UI can trust. Kept out of the route handler so they are testable on
 * their own and the handler reads as orchestration rather than data plumbing.
 */

/* ------------------------------------------------------------------ *
 * Request sanitising
 * ------------------------------------------------------------------ */

/** Clamp a requested trip length into the configured range. */
export function clampDays(requested: unknown): number {
  const { minDays, maxDays, defaultDays } = itineraryConfig.limits;
  const parsed = Number(requested);
  if (!Number.isFinite(parsed)) return defaultDays;
  return Math.min(Math.max(parsed, minDays), maxDays);
}

/**
 * Normalise the traveller's must-visit list: keep only non-empty strings,
 * trim, de-duplicate case-insensitively and cap the count so the prompt stays a
 * sane size.
 */
export function normalizeMustVisitPlaces(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of input) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= itineraryConfig.limits.maxMustVisitPlaces) break;
  }

  return out;
}

/** Resolve pace/interests/transport to their defaults when absent. */
export function normalizePreferences(request: TripRequest) {
  const { defaults } = itineraryConfig;
  return {
    pacing: request.pace || defaults.pace,
    interests:
      Array.isArray(request.interests) && request.interests.length > 0
        ? request.interests
        : defaults.interests,
    transport: request.transport || defaults.transport,
  };
}

/* ------------------------------------------------------------------ *
 * Model-output normalising
 * ------------------------------------------------------------------ */

/** Convert a value to a finite number, or `null` when it is not one. */
function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Flatten the model's `days[].stops[]` into one list of stops with numeric
 * coordinates. Stops with missing/invalid lat-lng are dropped so Leaflet never
 * receives NaN and crashes the map render.
 */
export function flattenStops(days: unknown): ItineraryStop[] {
  if (!Array.isArray(days)) return [];

  const stops: ItineraryStop[] = [];
  for (const day of days as DayPlan[]) {
    if (!Array.isArray(day?.stops)) continue;
    for (const stop of day.stops) {
      const lat = toFiniteNumber(stop?.lat);
      const lng = toFiniteNumber(stop?.lng);
      if (lat === null || lng === null) continue;
      stops.push({ ...stop, lat, lng });
    }
  }
  return stops;
}

/**
 * Rebuild `days` so there is exactly one entry per requested day, in order.
 *
 * The model sometimes returns only the first day's block (running out of output
 * tokens on a long trip), which is exactly the "only Day 1 shows" bug. The
 * stop buckets are the source of truth; the model's own titles/themes are kept
 * where they exist and fall back to config labels otherwise.
 */
export function buildDays(
  flatStops: ItineraryStop[],
  modelDays: unknown,
  requestedDays: number,
): DayPlan[] {
  const { fallbackDayTitle, fallbackDayTheme } = itineraryConfig.labels;

  const byDay = new Map<number, ItineraryStop[]>();
  for (const stop of flatStops) {
    const dayNum = Number.isFinite(Number(stop.day)) ? Number(stop.day) : 1;
    const bucket = byDay.get(dayNum);
    if (bucket) bucket.push(stop);
    else byDay.set(dayNum, [stop]);
  }

  const provided: DayPlan[] = Array.isArray(modelDays)
    ? (modelDays as DayPlan[])
    : [];

  const dayNumbers = [
    ...new Set([
      ...Array.from(
        { length: Math.max(1, requestedDays || 1) },
        (_, i) => i + 1,
      ),
      ...byDay.keys(),
    ]),
  ].sort((a, b) => a - b);

  return dayNumbers.map((dayNum) => {
    const existing = provided.find((d) => Number(d?.day) === dayNum);
    const stops = (byDay.get(dayNum) ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return {
      day: dayNum,
      title:
        existing?.title && existing.title.trim()
          ? existing.title
          : fallbackDayTitle.replace("{day}", String(dayNum)),
      theme:
        existing?.theme && existing.theme.trim()
          ? existing.theme
          : fallbackDayTheme,
      stops,
    };
  });
}

/**
 * Reconcile the model's corrected must-visit names against what was requested.
 *
 * The model is the only component that knows real place names anywhere in the
 * world, so it is asked to correct the traveller's spellings. But it can also
 * misbehave: return a shorter list, reorder it, duplicate entries or invent a
 * name. These chips are shown back to the traveller, so a wrong list is worse
 * than a misspelled one.
 *
 * So the model's answer is only trusted when it is a one-to-one match: same
 * length, no empty entries, no duplicates. Anything else falls back to the
 * requested list, which is always safe — it is literally what the user typed.
 */
export function reconcileMustVisitPlaces(
  requested: string[],
  corrected: unknown,
): string[] | undefined {
  if (requested.length === 0) return undefined;

  if (!Array.isArray(corrected) || corrected.length !== requested.length) {
    return requested;
  }

  const cleaned = corrected
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim());

  if (cleaned.length !== requested.length || cleaned.some((name) => !name)) {
    return requested;
  }

  // Duplicates mean the model collapsed two places into one name.
  const unique = new Set(cleaned.map((name) => name.toLowerCase()));
  if (unique.size !== cleaned.length) return requested;

  return cleaned;
}

/** Strip accidental markdown fences the model adds despite `responseMimeType`. */
export function stripCodeFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

/** Whether an error message looks like a transient failure worth retrying. */
export function isTransientError(message: string): boolean {
  return new RegExp(itineraryConfig.transientPattern, "i").test(message);
}

/**
 * Whether an error is the provider being momentarily overloaded (503/429/high
 * demand) rather than a timeout or a bad response. Used to tell the traveller
 * "it's busy, try again" instead of "it took too long", which are different
 * problems with different expectations.
 */
export function isBusyError(message: string): boolean {
  return new RegExp(itineraryConfig.busyPattern, "i").test(message);
}
