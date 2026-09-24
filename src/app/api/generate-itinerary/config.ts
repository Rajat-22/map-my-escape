import rawConfig from "./itinerary-prompt.json";

/**
 * Typed access to the itinerary generation config.
 *
 * Every tunable — model list, timeouts, generation params, limits, and the whole
 * prompt (prose + rules) — lives in `itinerary-prompt.json` so behaviour can be
 * adjusted without touching logic. This module is the single typed entry point
 * to it; nothing else should import the JSON directly.
 */
export interface ItineraryConfig {
  models: {
    candidates: string[];
    attemptsPerModel: number;
    retryDelayMs: number;
    /** How many full passes over `candidates` to make before giving up. */
    sweeps: number;
    /** Backoff before the 2nd..Nth sweep; scales up per sweep, capped below. */
    sweepBackoffMs: number;
    maxSweepBackoffMs: number;
  };
  budget: {
    totalBudgetMs: number;
    attemptTimeoutMs: number;
    minAttemptRemainingMs: number;
    minRemainingBeforeRetryMs: number;
  };
  generation: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType: string;
  };
  limits: {
    minDays: number;
    maxDays: number;
    defaultDays: number;
    maxMustVisitPlaces: number;
  };
  defaults: {
    pace: string;
    transport: string;
    interests: string[];
  };
  categories: string[];
  paceStops: Record<string, string>;
  labels: {
    fallbackDayTitle: string;
    fallbackDayTheme: string;
  };
  prompt: {
    role: string;
    requestHeader: string[];
    customNotesLine: string;
    mustVisitBlock: string;
    schemaIntro: string;
    schemaTemplate: string;
    rulesHeader: string;
    rules: string[];
  };
  errors: {
    invalidPayload: string;
    missingStartingCity: string;
    timeout: string;
    busy: string;
    notConfigured: string;
  };
  transientPattern: string;
  busyPattern: string;
}

export const itineraryConfig = rawConfig as ItineraryConfig;

/**
 * Environment overrides sit on top of the JSON so an operator can widen a
 * timeout or budget in one deployment without editing (and redeploying) config.
 * Missing/invalid env values fall back to the JSON value.
 */
export function resolveBudgetMs(): number {
  const fromEnv = Number(process.env.GEMINI_TOTAL_BUDGET_MS);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : itineraryConfig.budget.totalBudgetMs;
}

export function resolveAttemptTimeoutMs(): number {
  const fromEnv = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : itineraryConfig.budget.attemptTimeoutMs;
}

/** The model fallback order, newest first. */
export const candidateModels = itineraryConfig.models.candidates;

/** How many full passes over the model list to make before giving up. */
export const modelSweeps = Math.max(1, itineraryConfig.models.sweeps);

/**
 * Backoff before sweep `n` (1-based). Grows linearly with the sweep index and is
 * capped, so a short outage is ridden out without a long tail of waiting.
 */
export function sweepBackoffMs(sweep: number): number {
  const raw = itineraryConfig.models.sweepBackoffMs * sweep;
  return Math.min(raw, itineraryConfig.models.maxSweepBackoffMs);
}
