import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TripRequest, ItineraryData, ItineraryStop, DayPlan } from "@/types/itinerary";

// Gemini can take 30-45s on a full itinerary prompt, so allow enough time
// for the route handler to finish before the platform cancels it.
export const maxDuration = 60;

/**
 * Reconcile the model's corrected must-visit names against what was requested.
 *
 * The model is the only component that knows real place names anywhere in the
 * world, so it is asked to correct the traveller's spellings. But it can also
 * misbehave: return a shorter list, reorder it, duplicate entries or invent a
 * name. These chips are shown back to the traveller, so a wrong list is worse
 * than a misspelled one.
 *
 * So the model's answer is only trusted when it is a one-to-one match:
 * same length, no empty entries, no duplicates. Anything else falls back to the
 * requested list, which is always safe — it is literally what the user typed.
 */
function reconcileMustVisitPlaces(
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

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MapMyEscape AI Generator Engine is ready and operational.",
    keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    supportedModels: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"],
  });
}

export async function POST(req: NextRequest) {
  // Total time for the whole request, logged on both success and failure so
  // slow responses are visible in the server log.
  const requestStartedAt = Date.now();

  let tripRequest: TripRequest;
  try {
    tripRequest = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request payload." },
      { status: 400 }
    );
  }

  // Validate request
  if (!tripRequest.startingCity || typeof tripRequest.startingCity !== "string") {
    return NextResponse.json(
      { error: "Starting city is required." },
      { status: 400 }
    );
  }

  const days = Math.min(Math.max(Number(tripRequest.days) || 3, 1), 7);
  const pace = tripRequest.pace || "moderate";
  const interests =
    Array.isArray(tripRequest.interests) && tripRequest.interests.length > 0
      ? tripRequest.interests
      : ["cafe", "viewpoint", "trek"];
  const transport = tripRequest.transport || "Scooter & Local Cab";

  // User-supplied must-visit spots, corrected for spelling, de-duplicated and
  // capped so the prompt stays within a sane size.
  //
  // Correction happens HERE, at the edge, because the corrected names are what
  // the AI is asked to geocode and what gets stored on the itinerary — so the
  // form, the overlay and the saved plan all show the same official spelling.
  const mustVisitPlaces = Array.isArray(tripRequest.mustVisitPlaces)
    ? [
        ...new Set(
          tripRequest.mustVisitPlaces
            .filter((place): place is string => typeof place === "string")
            .map((place) => place.trim())
            .filter(Boolean),
        ),
      ].slice(0, 20)
    : [];

  const sanitizedRequest: TripRequest = {
    startingCity: tripRequest.startingCity.trim(),
    mustVisitPlaces: mustVisitPlaces.length > 0 ? mustVisitPlaces : undefined,
    days,
    interests,
    pace,
    transport,
    customNotes: tripRequest.customNotes?.trim() || undefined,
  };

  // Only requirement: a non-empty key is present in the environment.
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const isKeyConfigured = Boolean(apiKey);

  // If Gemini API Key is available, invoke AI with multi-model resiliency
  if (isKeyConfigured && apiKey) {
    // Order matters: newest first, then progressively more available fallbacks.
    // `gemini-flash-latest` frequently returns 503 under high demand, so it is last.
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];
    const genAI = new GoogleGenerativeAI(apiKey);

    const mustVisitBlock =
      mustVisitPlaces.length > 0
        ? `\nMUST-INCLUDE PLACES the traveler typed (their spelling may be wrong — see rule 8):\n${mustVisitPlaces
            .map((place, i) => `${i + 1}. ${place}`)
            .join("\n")}\nEvery one MUST appear as a stop in the itinerary. Distribute them sensibly across the days so the route stays geographically coherent, and fill the remaining slots with other great nearby spots.`
        : "";

    const prompt = `
You are MapMyEscape, an expert spontaneous travel planner. Generate a realistic, spatially sequenced day-by-day travel itinerary for:
- Destination / Starting Location: ${sanitizedRequest.startingCity}
- Duration: ${sanitizedRequest.days} Days
- Preferred Vibes / Interests: ${sanitizedRequest.interests.join(", ")}
- Pace: ${sanitizedRequest.pace} (${sanitizedRequest.pace === "relaxed" ? "2 stops per day" : sanitizedRequest.pace === "fast" ? "4-5 stops per day" : "3-4 stops per day"})
- Primary Transport: ${sanitizedRequest.transport}
${sanitizedRequest.customNotes ? `- Special Requests: ${sanitizedRequest.customNotes}\n` : ""}${mustVisitBlock}

Return valid JSON strictly matching this schema:
{
  "id": "escape-unique-id",
  "tripTitle": "Short catchy title",
  "startingCity": "${sanitizedRequest.startingCity}",
  "mustVisitPlaces": ${JSON.stringify(mustVisitPlaces)},
  "destinationSummary": "2-3 sentences overview of the journey vibe",
  "totalDays": ${sanitizedRequest.days},
  "pace": "${sanitizedRequest.pace}",
  "transport": "${sanitizedRequest.transport}",
  "highlights": ["3 key journey highlights"],
  "packingTips": ["3 essential practical packing items"],
  "days": [
    {
      "day": 1,
      "title": "Day 1: Theme title",
      "theme": "Theme description",
      "stops": [
        {
          "id": "stop-1-1",
          "day": 1,
          "order": 1,
          "timeOfDay": "Morning",
          "name": "Specific real location name",
          "category": "temple | cafe | trek | mountain | waterfall | beach | hotel | viewpoint | heritage | market | other",
          "lat": 0.0,
          "lng": 0.0,
          "estimatedDuration": "e.g. 1.5 hours",
          "travelTimeFromPrevious": "e.g. 15 min via scooter",
          "description": "Engaging description of why to visit",
          "insiderTip": "Specific insider local tip",
          "bestTimeToVisit": "Morning"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Coordinates ("lat" and "lng") MUST be accurate, valid floating-point numbers (numbers, never strings, never null, never NaN) for real places near ${sanitizedRequest.startingCity}.
2. Ensure realistic route sequence so user travels smoothly from one stop to the next.
3. Every stop must have a category from: temple, cafe, trek, mountain, waterfall, beach, hotel, viewpoint, heritage, market, other.
4. Output must be a single raw JSON object. Do not wrap it in markdown fences or add commentary.
5. Every stop must include the keys: id, day, order, timeOfDay, name, category, lat, lng, estimatedDuration, description, insiderTip.
6. Reflect EVERY entry in "mustVisitPlaces" as an actual stop in "days". Never silently drop one.
7. "mustVisitPlaces" in your output MUST be the SAME list you were given above, in the same order, but with each name corrected to the real, properly-spelled and properly-capitalised name of that place near ${sanitizedRequest.startingCity}. Fix typos, wrong casing and phonetic spellings (e.g. "ram jhuls" -> "Ram Jhula", "neelkanth mahadev" -> "Neelkanth Mahadev Temple"). This list is shown back to the traveler, so it must look right. If a name is already correct, or you cannot confidently identify the place, return it unchanged rather than inventing a name.
8. Use those same corrected names for the corresponding stops in "days", so the itinerary and the list agree.
9. "days" MUST contain exactly one entry for EVERY day of the trip, in order — ${sanitizedRequest.days} entries numbered 1 through ${sanitizedRequest.days}. Never return only the first day. Each stop's "day" must match the "day" of the entry it sits in.
`;

    // Total budget for the WHOLE request, across every model and retry.
    //
    // A per-attempt timeout alone is not enough: with 3 models x 2 attempts it
    // allowed 6 x 60s of waiting before giving up, which is why a hard failure
    // took ~88s instead of the intended minute. Every attempt now also has to
    // fit inside this deadline, so the traveller is told within ~1 minute.
    const totalBudgetMs = Number(process.env.GEMINI_TOTAL_BUDGET_MS) || 60000;
    const deadlineAt = requestStartedAt + totalBudgetMs;

    for (const modelName of candidateModels) {
      // The newest Gemini models emit reasoning tokens, so a full itinerary
      // prompt regularly takes 15-40s.
      const configuredTimeout = Number(process.env.GEMINI_TIMEOUT_MS) || 60000;

      for (let attempt = 1; attempt <= 2; attempt++) {
      const startedAt = Date.now();

      // Never let a single attempt run past the shared deadline.
      const remainingMs = deadlineAt - startedAt;
      if (remainingMs <= 1000) {
        console.warn(
          `[generate-itinerary] budget of ${(totalBudgetMs / 1000).toFixed(
            0,
          )}s exhausted; not starting ${modelName} attempt ${attempt}.`,
        );
        break;
      }
      const attemptTimeout = Math.min(configuredTimeout, remainingMs);

      try {
          const model = genAI.getGenerativeModel(
            {
              model: modelName,
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                maxOutputTokens: 8192,
              },
            },
            {
              timeout: attemptTimeout,
            }
          );

          const result = await model.generateContent(prompt);
          const textResponse = result.response.text();

          // Models occasionally wrap JSON in markdown fences despite responseMimeType.
          const cleaned = textResponse
            .replace(/^\s*```(?:json)?/i, "")
            .replace(/```\s*$/, "")
            .trim();

          const parsedData = JSON.parse(cleaned);

          // Validate parsed data structure
          if (
            parsedData &&
            Array.isArray(parsedData.days) &&
            parsedData.days.length > 0
          ) {
            const flatStops: ItineraryStop[] = [];
            parsedData.days.forEach((day: DayPlan) => {
              if (Array.isArray(day.stops)) {
                day.stops.forEach((stop: ItineraryStop) => {
                  // Drop stops with missing/invalid coordinates so Leaflet never
                  // receives NaN and crashes the map render.
                  if (Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng))) {
                    flatStops.push({
                      ...stop,
                      lat: Number(stop.lat),
                      lng: Number(stop.lng),
                    });
                  }
                });
              }
            });

            if (flatStops.length === 0) {
              throw new Error(
                `Model ${modelName} returned no stops with valid coordinates.`
              );
            }

            // Ensure a day object exists for every requested day.
            //
            // The model occasionally returns only the first day's block (it can
            // run out of output tokens on a long trip), so `days` comes back
            // short even though stops reference later day numbers. The timeline
            // renders the "All Days" view straight from `days`, so a short array
            // is exactly the "only Day 1 shows" bug. Rebuild the array from the
            // stops, preserving the model's titles/themes where they exist.
            const byDay = new Map<number, ItineraryStop[]>();
            for (const stop of flatStops) {
              const dayNum = Number.isFinite(Number(stop.day))
                ? Number(stop.day)
                : 1;
              const bucket = byDay.get(dayNum);
              if (bucket) bucket.push(stop);
              else byDay.set(dayNum, [stop]);
            }

            const modelDays: DayPlan[] = Array.isArray(parsedData.days)
              ? parsedData.days
              : [];
            const dayNumbers = [
              ...new Set([
                ...Array.from(
                  { length: Math.max(1, Number(sanitizedRequest.days) || 1) },
                  (_, i) => i + 1
                ),
                ...byDay.keys(),
              ]),
            ].sort((a, b) => a - b);

            const days: DayPlan[] = dayNumbers.map((dayNum) => {
              const existing = modelDays.find(
                (d) => Number(d?.day) === dayNum
              );
              const stops = (byDay.get(dayNum) ?? [])
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              return {
                day: dayNum,
                title:
                  existing?.title && existing.title.trim()
                    ? existing.title
                    : `Day ${dayNum}`,
                theme:
                  existing?.theme && existing.theme.trim()
                    ? existing.theme
                    : "Exploration",
                stops,
              };
            });

            const itinerary: ItineraryData = {
              ...parsedData,
              days,
              stops: flatStops,
              // The model is asked to correct the traveller's spellings; keep
              // the request's own list unless the model's answer is a
              // trustworthy one-to-one match for it.
              mustVisitPlaces: reconcileMustVisitPlaces(
                mustVisitPlaces,
                parsedData.mustVisitPlaces,
              ),
            };

            const elapsedMs = Date.now() - startedAt;
            console.log(
              `[generate-itinerary] OK via ${modelName} (attempt ${attempt}) in ${(
                elapsedMs / 1000
              ).toFixed(2)}s — ${flatStops.length} stops`,
            );

            return NextResponse.json({
              success: true,
              source: `gemini-ai (${modelName})`,
              elapsedMs,
              itinerary,
            });
          }

          throw new Error(`Model ${modelName} returned an unexpected JSON shape.`);
        } catch (aiError) {
          const message =
            aiError instanceof Error ? aiError.message : String(aiError);
          const elapsedMs = Date.now() - startedAt;
          console.warn(
            `[generate-itinerary] ${modelName} attempt ${attempt}/2 failed after ${(
              elapsedMs / 1000
            ).toFixed(2)}s: ${message}`
          );

          // Retry once on transient/timeout failures; do not retry bad output.
          const isTransient =
            /aborted|timeout|503|502|504|429|high demand|overloaded|fetch failed/i.test(
              message
            );
          if (!isTransient || attempt === 2) break;

          // Only wait if there is still enough of the budget left to be useful.
          if (deadlineAt - Date.now() < 3000) break;
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      // Stop trying further models once the shared deadline has passed.
      if (Date.now() >= deadlineAt) break;
    }
  }

  // Every model and retry has now been exhausted.
  //
  // This used to return a generated fallback itinerary. It no longer does:
  // that plan was template data ("Historic Heritage Landmark", "Artisanal
  // Coffee & Roastery") presented as if it were a real, researched route for
  // the traveller's destination. Showing plausible-looking wrong data is worse
  // than showing nothing, so the request now fails honestly and the UI tells
  // the traveller to try again.
  const elapsedMs = Date.now() - requestStartedAt;
  console.error(
    `[generate-itinerary] FAILED after ${(elapsedMs / 1000).toFixed(2)}s — ` +
      (isKeyConfigured
        ? "all Gemini models exhausted."
        : "GEMINI_API_KEY is not configured."),
  );

  return NextResponse.json(
    {
      success: false,
      error: isKeyConfigured
        ? "We couldn't finish building your itinerary in time. Please try again."
        : "Itinerary generation is not configured on this server.",
      elapsedMs,
    },
    { status: isKeyConfigured ? 504 : 503 },
  );
}

