import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TripRequest, ItineraryData, ItineraryStop, DayPlan } from "@/types/itinerary";
import { generateFallbackItinerary } from "@/lib/destinationData";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MapMyEscape AI Generator Engine is ready and operational.",
    supportedModels: ["gemini-1.5-flash", "gemini-1.5-pro"],
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

  const sanitizedRequest: TripRequest = {
    startingCity: tripRequest.startingCity.trim(),
    hotel: tripRequest.hotel?.trim() || undefined,
    days,
    interests,
    pace,
    transport,
    customNotes: tripRequest.customNotes?.trim() || undefined,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured =
    apiKey &&
    apiKey.trim() !== "" &&
    apiKey !== "your_actual_api_key_here";

  // If Gemini API Key is available, invoke AI
  if (isKeyConfigured) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const prompt = `
You are MapMyEscape, an expert spontaneous travel planner. Generate a realistic, spatially sequenced day-by-day travel itinerary for:
- Destination / Starting Location: ${sanitizedRequest.startingCity}
- Base Stay / Hotel: ${sanitizedRequest.hotel || "Centrally located boutique stay"}
- Duration: ${sanitizedRequest.days} Days
- Preferred Vibes / Interests: ${sanitizedRequest.interests.join(", ")}
- Pace: ${sanitizedRequest.pace} (${sanitizedRequest.pace === "relaxed" ? "2 stops per day" : sanitizedRequest.pace === "fast" ? "4-5 stops per day" : "3-4 stops per day"})
- Primary Transport: ${sanitizedRequest.transport}
${sanitizedRequest.customNotes ? `- Special Requests: ${sanitizedRequest.customNotes}` : ""}

Return valid JSON strictly matching this schema:
{
  "id": "escape-unique-id",
  "tripTitle": "Short catchy title",
  "startingCity": "${sanitizedRequest.startingCity}",
  "hotel": "${sanitizedRequest.hotel || ""}",
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
1. Coordinates ("lat" and "lng") MUST be accurate, valid floating numbers located near ${sanitizedRequest.startingCity}.
2. Ensure realistic route sequence so user travels smoothly from one stop to the next.
3. Every stop must have a category from: temple, cafe, trek, mountain, waterfall, beach, hotel, viewpoint, heritage, market, other.
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const parsedData = JSON.parse(textResponse);

      // Validate parsed data structure
      if (parsedData && Array.isArray(parsedData.days) && parsedData.days.length > 0) {
        // Flatten stops for direct map consumption
        const flatStops: ItineraryStop[] = [];
        parsedData.days.forEach((day: DayPlan) => {
          if (Array.isArray(day.stops)) {
            day.stops.forEach((stop: ItineraryStop) => flatStops.push(stop));
          }
        });

        const itinerary: ItineraryData = {
          ...parsedData,
          stops: flatStops,
          isFallback: false,
        };

        return NextResponse.json({
          success: true,
          source: "gemini-ai",
          itinerary,
        });
      }
    } catch (aiError) {
      console.warn("Gemini API call failed or timed out, activating intelligent fallback engine:", aiError);
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

