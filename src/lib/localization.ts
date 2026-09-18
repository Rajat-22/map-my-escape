import localization from "@/data/localization.json";

/**
 * All user-facing text lives in `src/data/localization.json`.
 *
 * Import `localization` directly to read a section (e.g.
 * `localization.form.submit`) or `t()` to fill in `{placeholders}`.
 *
 * Editing copy should never require touching a component — change the value in
 * the JSON and every place that renders it updates.
 */
export { localization };
export default localization;

/**
 * Replace `{token}` placeholders in a template string with the given values.
 *
 *   t("Save {count} escapes", { count: 3 }) // "Save 3 escapes"
 */
export function t(
  template: string,
  values: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}
