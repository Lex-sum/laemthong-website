import { formatBucket } from "@/lib/spec-format";
import type { Locale, SpecAttribute, SpecBucket } from "@/data/types";

/**
 * Spec filters in the catalog URL: one param per spec, `f.<spec key>=<value>,<value>`.
 * Values are option keys (choose one / several), ranges like `160-250`, `-160`, `400-`
 * (number specs, only the ranges defined on the spec), or `1` (yes / no specs).
 */
export const FILTER_PREFIX = "f.";

/** Selected filter values by spec key, as they appear in the URL */
export type SpecFilterSelection = Record<string, string[]>;

/** search_products / product_facets condition per attribute id */
export type SpecFilterCondition =
  | { options: string[] }
  | { ranges: SpecBucket[] }
  | { bool: boolean };

export function bucketParam(bucket: SpecBucket): string {
  return `${bucket.min ?? ""}-${bucket.max ?? ""}`;
}

/** Reads `f.*` params, keeping only values that exist for the category's filterable specs. */
export function parseSpecFilters(
  params: Record<string, string | string[] | undefined>,
  specs: SpecAttribute[]
): { selection: SpecFilterSelection; conditions: Record<string, SpecFilterCondition> } {
  const selection: SpecFilterSelection = {};
  const conditions: Record<string, SpecFilterCondition> = {};
  for (const spec of specs) {
    if (!spec.filterable) continue;
    const raw = params[FILTER_PREFIX + spec.key];
    const values = (Array.isArray(raw) ? raw.join(",") : raw ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) continue;

    if (spec.type === "single" || spec.type === "multi") {
      const options = spec.options.filter((o) => values.includes(o.key));
      if (options.length === 0) continue;
      selection[spec.key] = options.map((o) => o.key);
      conditions[spec.id] = { options: options.map((o) => o.id) };
    } else if (spec.type === "number") {
      const buckets = spec.buckets.filter((b) => values.includes(bucketParam(b)));
      if (buckets.length === 0) continue;
      selection[spec.key] = buckets.map(bucketParam);
      conditions[spec.id] = { ranges: buckets };
    } else if (spec.type === "boolean" && values.includes("1")) {
      selection[spec.key] = ["1"];
      conditions[spec.id] = { bool: true };
    }
  }
  return { selection, conditions };
}

export function hasSpecFilters(params: Record<string, string | string[] | undefined>): boolean {
  return Object.keys(params).some((key) => key.startsWith(FILTER_PREFIX) && params[key]);
}

/** product_facets row */
export type FacetRow = {
  attribute_id: string;
  option_id: string | null;
  bucket: number | null;
  product_count: number;
};

export type FilterChoice = { value: string; label: string; count: number; selected: boolean };

/** One spec as shown in the filter bar */
export type FilterGroup = {
  key: string;
  name: string;
  type: "options" | "boolean";
  choices: FilterChoice[];
};

/** Filter bar groups for the category's filterable specs, with product counts. */
export function buildFilterGroups(
  specs: SpecAttribute[],
  facets: FacetRow[],
  selection: SpecFilterSelection,
  locale: Locale
): FilterGroup[] {
  const groups: FilterGroup[] = [];
  for (const spec of specs) {
    if (!spec.filterable) continue;
    const selected = new Set(selection[spec.key] ?? []);
    const rows = facets.filter((f) => f.attribute_id === spec.id);
    const name = spec.name[locale] || spec.name.th;
    let choices: FilterChoice[] = [];

    if (spec.type === "single" || spec.type === "multi") {
      choices = spec.options.map((o) => ({
        value: o.key,
        label: o.label[locale] || o.label.th,
        count: Number(rows.find((r) => r.option_id === o.id)?.product_count ?? 0),
        selected: selected.has(o.key),
      }));
    } else if (spec.type === "number") {
      choices = spec.buckets.map((b, index) => ({
        value: bucketParam(b),
        label: formatBucket(b, spec.unit, locale),
        count: Number(rows.find((r) => r.bucket === index)?.product_count ?? 0),
        selected: selected.has(bucketParam(b)),
      }));
    } else if (spec.type === "boolean") {
      choices = [{
        value: "1",
        label: name,
        count: Number(rows[0]?.product_count ?? 0),
        selected: selected.has("1"),
      }];
    }

    // Hide specs no product in this category uses yet (unless something is selected)
    if (choices.every((c) => c.count === 0 && !c.selected)) continue;
    groups.push({ key: spec.key, name, type: spec.type === "boolean" ? "boolean" : "options", choices });
  }
  return groups;
}
