import type { ItineraryStop } from "@/types/itinerary";

/**
 * Road-following route geometry via OSRM.
 *
 * The map used to draw a straight line between each pair of stops, which cuts
 * across rivers, buildings and private land. This module asks OSRM (the
 * OpenStreetMap routing engine) for the actual road geometry so the line reads
 * like a navigation route.
 *
 * Cost: OSRM is free and open source (2-clause BSD) and this uses the public
 * demo server, so there is no API key and no billing.
 *
 * WHY ONE REQUEST FOR THE WHOLE TRIP
 * The public demo server asks for "one request per second max, no scraping, no
 * heavy usage" (https://project-osrm.org/docs/v5.24.0/api/). OSRM accepts many
 * coordinates in a single call, so the whole itinerary is fetched in ONE
 * request instead of one per day. Results are cached per coordinate set, so
 * re-renders, day-tab switches and remounts cost nothing.
 *
 * Failure is never fatal: if the network is down, the server is rate-limiting,
 * or a stop pair is unroutable, the caller falls back to the straight line it
 * drew before. The map must always render.
 */

const OSRM_BASE = "https://router.project-osrm.org";

/** Trip legs are all driven in this app's UI, so "driving" is the profile. */
const PROFILE = "driving";

/** Give up on a slow route rather than leaving the map blank. */
const REQUEST_TIMEOUT_MS = 12000;

/**
 * In-memory cache keyed by the coordinate set. Survives re-renders and tab
 * switches within a session; cleared on reload, which is fine for geometry
 * that never changes for a given itinerary.
 */
const routeCache = new Map<string, [number, number][]>();

/**
 * In-flight requests, so several components asking for the same route at the
 * same moment share one network call instead of stampeding the demo server.
 */
const inFlight = new Map<string, Promise<[number, number][] | null>>();

/** OSRM "polyline" geometry is Google's encoded polyline algorithm, precision 5. */
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    // Latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Longitude
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // OSRM returns precision 5, so divide by 1e5 to get degrees.
    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

function cacheKey(points: [number, number][]): string {
  return points
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join(";");
}

/**
 * Fetch the road-following geometry through a list of stops, in order.
 *
 * Returns an array of decoded [lat, lng] points, or null when routing is
 * unavailable — the caller should then keep drawing its straight line.
 *
 * @param points Ordered stops as [lat, lng]. Needs at least 2 entries.
 */
export async function fetchRoadPath(
  points: [number, number][],
): Promise<[number, number][] | null> {
  if (points.length < 2) return null;

  const key = cacheKey(points);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  // OSRM expects lon,lat — the reverse of Leaflet's lat,lng — joined by ';'.
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url =
    `${OSRM_BASE}/route/v1/${PROFILE}/${coords}` +
    `?overview=full&geometries=polyline&steps=false&alternatives=false`;

  const request = (async (): Promise<[number, number][] | null> => {
    try {
      // Without an abort, a hung request would keep the map on straight lines
      // forever with no way to retry.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(
          `[route] OSRM responded ${res.status}; using straight lines.`,
        );
        return null;
      }

      const data = await res.json();
      const geometry = data?.routes?.[0]?.geometry;

      if (data?.code !== "Ok" || typeof geometry !== "string") {
        console.warn(
          "[route] OSRM returned no usable geometry; using straight lines.",
        );
        return null;
      }

      const decoded = decodePolyline(geometry);
      // A genuinely road-followed route always has more vertices than the
      // handful of stops we sent. If it does not, treat it as unusable.
      if (decoded.length < points.length) return null;

      routeCache.set(key, decoded);
      return decoded;
    } catch (err) {
      // AbortError on timeout, TypeError on network failure — both non-fatal.
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[route] Routing unavailable (${message}); using straight lines.`,
      );
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
}

/**
 * Fetch road geometry for every day in one OSRM call each, keyed by day.
 *
 * Days are routed as separate legs (a day's route should not run through the
 * next day's stops), but they are issued sequentially rather than in parallel
 * to stay respectful of the demo server's one-request-per-second guidance.
 *
 * Any day that fails is simply absent from the result map, and the caller
 * draws its straight line for that day.
 */
export async function fetchRoadPathsByDay(
  stops: ItineraryStop[],
): Promise<Record<number, [number, number][]>> {
  const byDay = new Map<number, [number, number][]>();

  // Preserve the itinerary's intended order within each day.
  for (const stop of [...stops].sort((a, b) => a.order - b.order)) {
    if (!byDay.has(stop.day)) byDay.set(stop.day, []);
    byDay.get(stop.day)!.push([stop.lat, stop.lng]);
  }

  const result: Record<number, [number, number][]> = {};

  for (const [day, points] of byDay) {
    if (points.length < 2) continue;
    const path = await fetchRoadPath(points);
    if (path) result[day] = path;
  }

  return result;
}
