import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TripRequest, ItineraryData, ItineraryStop, DayPlan } from "@/types/itinerary";
import { generateFallbackItinerary } from "@/lib/destinationData";

// Gemini can take 30-45s on a full itinerary prompt, so allow enough time
// for the route handler to finish before the platform cancels it.
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MapMyEscape AI Generator Engine is ready and operational.",
    keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    supportedModels: ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"],
  });
}

export async function POST(req: NextRequest) {
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

  // User-supplied must-visit spots: trimmed, de-duplicated, capped so the
  // prompt stays within a sane size.
  const mustVisitPlaces = Array.isArray(tripRequest.mustVisitPlaces)
    ? [
        ...new Set(
          tripRequest.mustVisitPlaces
            .filter((place): place is string => typeof place === "string")
            .map((place) => place.trim())
            .filter(Boolean)
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
        ? `\nMUST-INCLUDE PLACES (the traveler explicitly asked for these — every single one MUST appear as a stop in the itinerary, using its exact real name and accurate coordinates):\n${mustVisitPlaces
            .map((place, i) => `${i + 1}. ${place}`)
            .join("\n")}\nDistribute them sensibly across the days so the route stays geographically coherent. Fill the remaining slots with other great nearby spots.`
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
  "bestSeason": "e.g. October to March",
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
6. Reflect EVERY entry in "mustVisitPlaces" as an actual stop in "days", keeping the traveler's exact place names. Never silently drop one.
`;

    for (const modelName of candidateModels) {
      // The newest Gemini models emit reasoning tokens, so a full itinerary
      // prompt regularly takes 15-40s. The old 15s timeout aborted every call
      // and silently fell back to the generator.
      const attemptTimeout = Number(process.env.GEMINI_TIMEOUT_MS) || 45000;

      for (let attempt = 1; attempt <= 2; attempt++) {
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

            const itinerary: ItineraryData = {
              ...parsedData,
              stops: flatStops,
              isFallback: false,
            };

            return NextResponse.json({
              success: true,
              source: `gemini-ai (${modelName})`,
              itinerary,
            });
          }

          throw new Error(`Model ${modelName} returned an unexpected JSON shape.`);
        } catch (aiError) {
          const message =
            aiError instanceof Error ? aiError.message : String(aiError);
          console.warn(
            `[generate-itinerary] ${modelName} attempt ${attempt}/2 failed: ${message}`
          );

          // Retry once on transient/timeout failures; do not retry bad output.
          const isTransient =
            /aborted|timeout|503|502|504|429|high demand|overloaded|fetch failed/i.test(
              message
            );
          if (!isTransient || attempt === 2) break;
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  // Fallback engine: generate authentic, accurately-geocoded itinerary
  const fallbackItinerary = generateFallbackItinerary(sanitizedRequest);
  return NextResponse.json({
    success: true,
    source: isKeyConfigured ? "fallback-error-recovery" : "intelligent-generator",
    message: isKeyConfigured
      ? "AI fallback activated."
      : "Demo generator active. Provide GEMINI_API_KEY in .env.local to enable live Gemini AI queries.",
    itinerary: fallbackItinerary,
  });
}

