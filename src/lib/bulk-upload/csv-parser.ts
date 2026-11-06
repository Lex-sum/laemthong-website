import Papa from "papaparse";
import type { ParsedCsv, ParsedProductRow, ParsedFeature } from "./types";

/**
 * Reads an uploaded CSV as text. Our exports are UTF-8 (with BOM), but Excel's plain
 * "CSV (Comma delimited)" save on Thai Windows writes TIS-620 / Windows-874, which
 * would turn Thai into garbage if read as UTF-8 — so fall back to that encoding.
 */
export async function readCsvFile(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes); // also drops a BOM
  } catch {
    return new TextDecoder("windows-874").decode(bytes);
  }
}

/** Columns the import understands. Order doesn't matter — values are matched by header name. */
export const CSV_COLUMNS = [
  "slug",
  "category_slug",
  "brand_slug",
  "name_th",
  "name_en",
  "short_description_th",
  "short_description_en",
  "description_th",
  "description_en",
  "featured",
  "features_th",
  "features_en",
] as const;

export const REQUIRED_CSV_COLUMNS = [
  "slug",
  "category_slug",
  "brand_slug",
  "name_th",
  "short_description_th",
] as const;

const KNOWN = new Set<string>(CSV_COLUMNS);

/** Spec columns: `spec:<spec key>` (and `spec:<key>:en` for the English of a text spec) */
export const SPEC_COLUMN_PREFIX = "spec:";

export function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value.split("|").map((s) => s.trim());
}

/** Parses a product CSV (see parseProductRecords). */
export function parseProductCSV(csvText: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^﻿/, "").trim().toLowerCase(),
  });

  // Rows with too few / too many cells are fine (missing cells are blank)
  const fatal = result.errors.filter((e) => e.type !== "FieldMismatch");
  if (fatal.length > 0) {
    throw new Error(`CSV parsing error: ${fatal.map((e) => e.message).join(", ")}`);
  }

  return parseProductRecords(result.data, (result.meta.fields ?? []).filter(Boolean));
}

/**
 * Turns spreadsheet rows (CSV or Excel) into product rows, by header name: columns can
 * be in any order and optional columns can be left out. A column that is not in the file
 * is skipped (existing products keep their value); a column in the file sets the value,
 * so a blank cell clears it. Header names are expected trimmed and lowercase.
 * Throws if a required column is missing from the header.
 */
export function parseProductRecords(records: Record<string, string>[], columns: string[]): ParsedCsv {
  const missing = REQUIRED_CSV_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        `The header row must contain ${REQUIRED_CSV_COLUMNS.join(", ")} (any order).`
    );
  }

  const specColumns = columns.filter((c) => c.startsWith(SPEC_COLUMN_PREFIX) && c.length > SPEC_COLUMN_PREFIX.length);
  const ignoredColumns = columns.filter((c) => !KNOWN.has(c) && !specColumns.includes(c));

  const rows: ParsedProductRow[] = records.map((row, index) => {
    // undefined = column not in the file (skip), "" = blank cell (clear)
    const cell = (column: string) =>
      columns.includes(column) ? (String(row[column] ?? "").trim()) : undefined;

    const featuresTh = cell("features_th");
    const featuresEn = cell("features_en");

    let parsedFeatures: ParsedFeature[] | undefined;
    if (featuresTh !== undefined || featuresEn !== undefined) {
      const featuresThArr = splitPipe(featuresTh);
      const featuresEnArr = splitPipe(featuresEn);
      const featureCount = Math.max(featuresThArr.length, featuresEnArr.length);
      parsedFeatures = [];
      for (let i = 0; i < featureCount; i++) {
        parsedFeatures.push({ th: featuresThArr[i] || "", en: featuresEnArr[i] || "" });
      }
    }

    return {
      // Line number in the file (header is line 1)
      index: index + 2,
      data: {
        slug: cell("slug") ?? "",
        categorySlug: cell("category_slug") ?? "",
        brandSlug: cell("brand_slug") ?? "",
        nameTh: cell("name_th") ?? "",
        nameEn: cell("name_en"),
        shortDescriptionTh: cell("short_description_th") ?? "",
        shortDescriptionEn: cell("short_description_en"),
        descriptionTh: cell("description_th"),
        descriptionEn: cell("description_en"),
        featured: cell("featured"),
        featuresTh,
        featuresEn,
        parsedFeatures,
        specCells: Object.fromEntries(
          specColumns.map((c) => [c.slice(SPEC_COLUMN_PREFIX.length), String(row[c] ?? "").trim()])
        ),
      },
    };
  });

  return { rows, columns, ignoredColumns };
}

/**
 * Column not in file → undefined (skip); blank, "false"/"0"/"no" → false;
 * "true"/"1"/"yes" → true; anything else → null (invalid).
 */
export function parseFeatured(value: string | undefined): boolean | undefined | null {
  if (value === undefined) return undefined;
  const v = value.toLowerCase();
  if (v === "") return false;
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
}
