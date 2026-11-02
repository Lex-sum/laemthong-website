import Papa from "papaparse";
import type { ParsedCsv, ParsedProductRow, ParsedSpecification, ParsedFeature } from "./types";

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
  "spec_labels_th",
  "spec_labels_en",
  "spec_values_th",
  "spec_values_en",
  "features_th",
  "features_en",
] as const;

export const REQUIRED_CSV_COLUMNS = ["slug", "category_slug", "brand_slug", "name_th"] as const;

const KNOWN = new Set<string>(CSV_COLUMNS);

function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value.split("|").map((s) => s.trim());
}

/**
 * Parses a product CSV by header name: columns can be in any order and optional columns
 * can be left out. A missing column or a blank cell means "no value" — new products get
 * an empty field and existing products keep what they have.
 * Throws if a required column is missing from the header.
 */
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

  const columns = (result.meta.fields ?? []).filter(Boolean);
  const missing = REQUIRED_CSV_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new Error(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        `The header row must contain ${REQUIRED_CSV_COLUMNS.join(", ")} (any order).`
    );
  }

  const ignoredColumns = columns.filter((c) => !KNOWN.has(c));

  const rows: ParsedProductRow[] = result.data.map((row, index) => {
    const cell = (column: string) => row[column]?.trim() || undefined;

    const specLabelsTh = cell("spec_labels_th");
    const specLabelsEn = cell("spec_labels_en");
    const specValuesTh = cell("spec_values_th");
    const specValuesEn = cell("spec_values_en");
    const featuresTh = cell("features_th");
    const featuresEn = cell("features_en");

    let parsedSpecifications: ParsedSpecification[] | undefined;
    if (specLabelsTh || specLabelsEn || specValuesTh || specValuesEn) {
      const labelsThArr = splitPipe(specLabelsTh);
      const labelsEnArr = splitPipe(specLabelsEn);
      const valuesThArr = splitPipe(specValuesTh);
      const valuesEnArr = splitPipe(specValuesEn);
      const specCount = Math.max(
        labelsThArr.length,
        labelsEnArr.length,
        valuesThArr.length,
        valuesEnArr.length
      );
      parsedSpecifications = [];
      for (let i = 0; i < specCount; i++) {
        parsedSpecifications.push({
          label: { th: labelsThArr[i] || "", en: labelsEnArr[i] || "" },
          value: { th: valuesThArr[i] || "", en: valuesEnArr[i] || "" },
        });
      }
    }

    let parsedFeatures: ParsedFeature[] | undefined;
    if (featuresTh || featuresEn) {
      const featuresThArr = splitPipe(featuresTh);
      const featuresEnArr = splitPipe(featuresEn);
      const featureCount = Math.max(featuresThArr.length, featuresEnArr.length);
      parsedFeatures = [];
      for (let i = 0; i < featureCount; i++) {
        parsedFeatures.push({ th: featuresThArr[i] || "", en: featuresEnArr[i] || "" });
      }
    }

    return {
      // CSV line number (header is line 1)
      index: index + 2,
      data: {
        slug: cell("slug") ?? "",
        categorySlug: cell("category_slug") ?? "",
        brandSlug: cell("brand_slug") ?? "",
        nameTh: cell("name_th") ?? "",
        nameEn: cell("name_en"),
        shortDescriptionTh: cell("short_description_th"),
        shortDescriptionEn: cell("short_description_en"),
        descriptionTh: cell("description_th"),
        descriptionEn: cell("description_en"),
        featured: cell("featured"),
        specLabelsTh,
        specLabelsEn,
        specValuesTh,
        specValuesEn,
        featuresTh,
        featuresEn,
        parsedSpecifications,
        parsedFeatures,
      },
    };
  });

  return { rows, columns, ignoredColumns };
}

/** "true"/"1"/"yes" → true, "false"/"0"/"no" → false, blank → undefined, anything else → null. */
export function parseFeatured(value: string | undefined): boolean | undefined | null {
  if (value === undefined) return undefined;
  const v = value.toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
}
