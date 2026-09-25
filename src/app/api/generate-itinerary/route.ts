import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TripRequest, ItineraryData } from "@/types/itinerary";
import {
  candidateModels,
  itineraryConfig,
  modelSweeps,
  resolveAttemptTimeoutMs,
  resolveBudgetMs,
  sweepBackoffMs,
} from "./config";
import { buildItineraryPrompt } from "./itineraryPrompt";
import {
  buildDays,
  clampDays,
  flattenStops,
  isBusyError,
  isTransientError,
  normalizeMustVisitPlaces,
  normalizePreferences,
  reconcileMustVisitPlaces,
  stripCodeFences,
} from "./itineraryValidation";

// Gemini can take 30-45s on a full itinerary prompt, and longer under load, so
// allow enough time for the route handler to finish before the platform cancels
// it. 2 minutes gives every model + retry a real chance instead of failing at 60s.
export const maxDuration = 120;

const TAG = "[generate-itinerary]";
const seconds = (ms: number) => (ms / 1000).toFixed(2);

/** The minimal, trusted version of the traveller's request. */
interface SanitizedRequest {
  startingCity: string;
  mustVisitPlaces: string[];
  days: number;
  interests: string[];
  pace: string;
  transport: string;
  customNotes?: string;
}

/**
 * Turn raw form input into a sanitized request, or an error message when the
 * payload is unusable. Pure apart from nothing â€” no I/O, so it is easy to test.
 */
function sanitize(
  raw: TripRequest,
): { ok: true; value: SanitizedRequest } | { ok: false; error: string } {
  if (!raw.startingCity || typeof raw.startingCity !== "string") {
    return { ok: false, error: itineraryConfig.errors.missingStartingCity };
  }

  const { pacing, interests, transport } = normalizePreferences(raw);
  const mustVisitPlaces = normalizeMustVisitPlaces(raw.mustVisitPlaces);

  return {
    ok: true,
    value: {
      startingCity: raw.startingCity.trim(),
      mustVisitPlaces,
      days: clampDays(raw.days),
      interests,
      pace: pacing,
      transport,
      customNotes: raw.customNotes?.trim() || undefined,
    },
  };
}

/**
 * Read the model's JSON, normalise it, and assemble a `ItineraryData`.
 * Throws when the shape is unusable so the caller can treat it as a failed
 * attempt and move on to the next model.
 */
function toItinerary(
  parsedData: Record<string, unknown>,
  request: SanitizedRequest,
  modelName: string,
): ItineraryData {
  if (!parsedData || !Array.isArray(parsedData.days) || parsedData.days.length === 0) {
    throw new Error(`Model ${modelName} returned an unexpected JSON shape.`);
  }

  const flatStops = flattenStops(parsedData.days);
  if (flatStops.length === 0) {
    throw new Error(`Model ${modelName} returned no stops with valid coordinates.`);
  }

  const days = buildDays(flatStops, parsedData.days, request.days);

  return {
    ...(parsedData as unknown as ItineraryData),
    days,
    stops: flatStops,
    // Keep the request's own list unless the model's answer is a trustworthy
    // one-to-one match for it.
    mustVisitPlaces: reconcileMustVisitPlaces(
      request.mustVisitPlaces,
      parsedData.mustVisitPlaces,
    ),
  };
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Escape-Route AI Generator Engine is ready and operational.",
    keyConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    supportedModels: candidateModels,
  });
}

export async function POST(req: NextRequest) {
  // Total time for the whole request, logged on both success and failure so
  // slow responses are visible in the server log.
  const requestStartedAt = Date.now();

  let raw: TripRequest;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: itineraryConfig.errors.invalidPayload },
      { status: 400 },
    );
  }

  const sanitized = sanitize(raw);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }
  const request = sanitized.value;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const isKeyConfigured = Boolean(apiKey);

  // Why the last attempt failed, so the final response can say the right thing:
  // a busy provider and a slow one need different copy and status codes.
  let lastErrorMessage = "";

  if (isKeyConfigured && apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildItineraryPrompt(request);

    const totalBudgetMs = resolveBudgetMs();
    const deadlineAt = requestStartedAt + totalBudgetMs;

    // Outer sweep: a provider-wide 503 spike usually clears within seconds, so
    // after a full pass fails we wait and try the whole model list again. The
    // shared deadline still bounds the total time, so this cannot run away.
    for (let sweep = 1; sweep <= modelSweeps; sweep++) {
      // Backoff before every sweep after the first (the first runs immediately).
      if (sweep > 1) {
        const waitMs = sweepBackoffMs(sweep - 1);
        if (deadlineAt - Date.now() <= waitMs) {
          console.warn(
            `${TAG} no budget left for sweep ${sweep} backoff; stopping.`,
          );
          break;
        }
        console.warn(
          `${TAG} all models failed (sweep ${sweep - 1}/${modelSweeps}); backing off ${waitMs}ms before retrying.`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      for (const modelName of candidateModels) {
        const configuredTimeout = resolveAttemptTimeoutMs();

        for (
          let attempt = 1;
          attempt <= itineraryConfig.models.attemptsPerModel;
          attempt++
        ) {
          const startedAt = Date.now();

          // Never let a single attempt run past the shared deadline. A per-attempt
          // timeout alone is not enough - with 3 models x 2 attempts it allowed
          // six full timeouts before giving up - so every attempt also has to fit
          // inside this budget.
          const remainingMs = deadlineAt - startedAt;
          if (remainingMs <= itineraryConfig.budget.minAttemptRemainingMs) {
            console.warn(
              `${TAG} budget of ${seconds(totalBudgetMs)}s exhausted; not starting ${modelName} attempt ${attempt}.`,
            );
            break;
          }

          try {
            const model = genAI.getGenerativeModel(
              {
                model: modelName,
                generationConfig: {
                  responseMimeType: itineraryConfig.generation.responseMimeType,
                  temperature: itineraryConfig.generation.temperature,
                  maxOutputTokens: itineraryConfig.generation.maxOutputTokens,
                },
              },
              { timeout: Math.min(configuredTimeout, remainingMs) },
            );

            const result = await model.generateContent(prompt);
            const parsedData = JSON.parse(
              stripCodeFences(result.response.text()),
            );
            const itinerary = toItinerary(parsedData, request, modelName);

            const elapsedMs = Date.now() - startedAt;
            console.log(
              `${TAG} OK via ${modelName} (sweep ${sweep}, attempt ${attempt}) in ${seconds(elapsedMs)}s - ${itinerary.stops.length} stops`,
            );

            return NextResponse.json({
              success: true,
              source: `gemini-ai (${modelName})`,
              elapsedMs,
              itinerary,
            });
          } catch (aiError) {
            const message =
              aiError instanceof Error ? aiError.message : String(aiError);
            lastErrorMessage = message;
            console.warn(
              `${TAG} ${modelName} sweep ${sweep} attempt ${attempt}/${itineraryConfig.models.attemptsPerModel} failed after ${seconds(
                Date.now() - startedAt,
              )}s: ${message}`,
            );

            // Retry once on transient/timeout failures; do not retry bad output.
            const isLastAttempt =
              attempt === itineraryConfig.models.attemptsPerModel;
            if (!isTransientError(message) || isLastAttempt) break;

            // Only wait if there is still enough of the budget left to be useful.
            if (
              deadlineAt - Date.now() <
              itineraryConfig.budget.minRemainingBeforeRetryMs
            ) {
              break;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, itineraryConfig.models.retryDelayMs),
            );
          }
        }

        // Stop trying further models once the shared deadline has passed.
        if (Date.now() >= deadlineAt) break;
      }

      // Stop sweeping once the shared deadline has passed.
      if (Date.now() >= deadlineAt) break;
    }
  }

  // Every sweep, model and retry has now been exhausted.
  //
  // This deliberately does NOT return a fallback itinerary: template data
  // presented as a researched route is worse than an honest failure, so the UI
  // is told to try again instead.
  const elapsedMs = Date.now() - requestStartedAt;
  const wasBusy = isBusyError(lastErrorMessage);
  console.error(
    `${TAG} FAILED after ${seconds(elapsedMs)}s - ` +
      (isKeyConfigured
        ? wasBusy
          ? "all Gemini models overloaded (503/429)."
          : "all Gemini models exhausted."
        : "GEMINI_API_KEY is not configured."),
  );

  return NextResponse.json(
    {
      success: false,
      error: isKeyConfigured
        ? wasBusy
          ? itineraryConfig.errors.busy
          : itineraryConfig.errors.timeout
        : itineraryConfig.errors.notConfigured,
      elapsedMs,
    },
    { status: isKeyConfigured ? (wasBusy ? 503 : 504) : 503 },
  );
}
