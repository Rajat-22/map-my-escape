import { itineraryConfig } from "./config";

/**
 * Fill `{token}` placeholders from a map. Kept local (not imported from the UI
 * `t()`) so this server module has no dependency on client-side copy.
 */
function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export interface PromptInput {
  startingCity: string;
  days: number;
  interests: string[];
  pace: string;
  transport: string;
  customNotes?: string;
  mustVisitPlaces: string[];
}

/**
 * Build the full generation prompt from config + the sanitized request.
 *
 * The prose, the JSON schema example and the numbered rules all live in
 * `itinerary-prompt.json`; this only stitches them together and injects the
 * request-specific values, so editing the prompt never means editing code.
 */
export function buildItineraryPrompt(input: PromptInput): string {
  const { prompt, categories, paceStops } = itineraryConfig;

  const values: Record<string, string | number> = {
    startingCity: input.startingCity,
    days: input.days,
    interests: input.interests.join(", "),
    pace: input.pace,
    paceStops: paceStops[input.pace] ?? paceStops.moderate,
    transport: input.transport,
    categoryList: categories.join(" | "),
    mustVisitJson: JSON.stringify(input.mustVisitPlaces),
  };

  const headerLines = prompt.requestHeader.map((line) => fill(line, values));
  if (input.customNotes) {
    headerLines.push(
      fill(prompt.customNotesLine, { customNotes: input.customNotes }),
    );
  }

  const mustVisitBlock =
    input.mustVisitPlaces.length > 0
      ? fill(prompt.mustVisitBlock, {
          mustVisitList: input.mustVisitPlaces
            .map((place, i) => `${i + 1}. ${place}`)
            .join("\n"),
        })
      : "";

  const rules = prompt.rules
    .map((rule, i) => `${i + 1}. ${fill(rule, values)}`)
    .join("\n");

  return [
    prompt.role,
    ...headerLines,
    mustVisitBlock,
    prompt.schemaIntro,
    fill(prompt.schemaTemplate, values),
    prompt.rulesHeader,
    rules,
  ]
    .filter((section) => section.trim().length > 0)
    .join("\n")
    .trim();
}
