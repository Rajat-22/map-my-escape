import { ItineraryData, TripRequest } from "@/types/itinerary";

/**
 * Single source of truth for the itinerary generation endpoint.
 *
 * Both the form submit and the remix flow hit the same route, so the URL lives
 * here rather than being repeated (and drifting) at each call site.
 */
const GENERATE_ITINERARY_ENDPOINT = "/api/generate-itinerary";

/** Shape the route handler returns on success. */
interface GenerateSuccessPayload {
  success?: boolean;
  source?: string;
  elapsedMs?: number;
  itinerary?: ItineraryData;
}

/** Shape the route handler returns on failure. */
interface GenerateErrorPayload {
  success?: boolean;
  error?: string;
  elapsedMs?: number;
}

/**
 * A generation attempt either succeeds with an itinerary, or fails with a
 * message safe to show the traveller. Modelled as a discriminated union so
 * callers must handle both branches and never get a half-populated result.
 */
export type GenerateItineraryResult =
  | { ok: true; itinerary: ItineraryData; source?: string }
  | { ok: false; error?: string };

/**
 * Request a generated itinerary for the given trip.
 *
 * Owns the whole network round-trip: the endpoint, the POST, tolerant JSON
 * parsing and the success/failure split. It deliberately does NOT throw — a
 * network failure resolves to `{ ok: false }` with no message, so the caller
 * can substitute its own context-specific wording (a first submit and a remix
 * phrase their failures differently).
 *
 * Logging is tagged with `label` so the two flows stay distinguishable in the
 * console while sharing this one implementation.
 */
export async function generateItinerary(
  request: TripRequest,
  label = "itinerary",
): Promise<GenerateItineraryResult> {
  const startedAt = Date.now();

  try {
    const res = await fetch(GENERATE_ITINERARY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    // A gateway or crash can return a non-JSON body; treat that as "no data"
    // rather than letting the parse rejection mask the failure.
    const data: GenerateSuccessPayload & GenerateErrorPayload = await res
      .json()
      .catch(() => ({}));

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

    if (res.ok && data.itinerary) {
      console.log(`[itinerary] ${label} in ${elapsed}s (${data.source})`);
      return { ok: true, itinerary: data.itinerary, source: data.source };
    }

    // No fallback data is fabricated here: the server's message (or the
    // caller's default) is what the traveller sees.
    console.warn(`[itinerary] ${label} failed after ${elapsed}s:`, data.error);
    return { ok: false, error: data.error };
  } catch (err) {
    console.warn(`${label} request failed:`, err);
    return { ok: false };
  }
}
