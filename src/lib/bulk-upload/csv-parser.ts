import Papa from "papaparse";
import type { ParsedProductRow, ParsedSpecification, ParsedFeature } from "./types";

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

function splitPipe(value: string): string[] {
  if (!value) return [];
  return value.split("|").map((s) => s.trim());
}

export function parseProductCSV(csvText: string): ParsedProductRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parsing error: ${result.errors.map((e) => e.message).join(", ")}`
    );
  }

  return result.data.map((row, index) => {
    // Read raw pipe-separated columns
    const specLabelsTh = row.spec_labels_th?.trim() || "";
    const specLabelsEn = row.spec_labels_en?.trim() || "";
    const specValuesTh = row.spec_values_th?.trim() || "";
    const specValuesEn = row.spec_values_en?.trim() || "";
    const featuresTh = row.features_th?.trim() || "";
    const featuresEn = row.features_en?.trim() || "";

    // Parse specifications
    const hasSpecs = specLabelsTh || specLabelsEn || specValuesTh || specValuesEn;
    let parsedSpecifications: ParsedSpecification[] | undefined;

    if (hasSpecs) {
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

    // Parse features
    const hasFeatures = featuresTh || featuresEn;
    let parsedFeatures: ParsedFeature[] | undefined;

    if (hasFeatures) {
      const featuresThArr = splitPipe(featuresTh);
      const featuresEnArr = splitPipe(featuresEn);
      const featureCount = Math.max(featuresThArr.length, featuresEnArr.length);
      parsedFeatures = [];
      for (let i = 0; i < featureCount; i++) {
        parsedFeatures.push({
          th: featuresThArr[i] || "",
          en: featuresEnArr[i] || "",
        });
      }
    }

    return {
      index: index + 1,
      data: {
        slug: row.slug?.trim() || "",
        nameTh: row.name_th?.trim() || "",
        nameEn: row.name_en?.trim() || "",
        shortDescriptionTh: row.short_description_th?.trim() || "",
        shortDescriptionEn: row.short_description_en?.trim() || "",
        descriptionTh: row.description_th?.trim() || "",
        descriptionEn: row.description_en?.trim() || "",
        categorySlug: row.category_slug?.trim() || "",
        brandSlug: row.brand_slug?.trim() || "",
        featured: row.featured?.trim() || undefined,
        sortOrder: row.sort_order ? parseInt(row.sort_order, 10) : 0,
        // Complex fields omitted for CSV format
        gallery: undefined,
        specifications: undefined,
        features: undefined,
        documents: undefined,
        image: undefined,
        // Pipe-separated raw strings
        specLabelsTh: specLabelsTh || undefined,
        specLabelsEn: specLabelsEn || undefined,
        specValuesTh: specValuesTh || undefined,
        specValuesEn: specValuesEn || undefined,
        featuresTh: featuresTh || undefined,
        featuresEn: featuresEn || undefined,
        // Parsed structured data
        parsedSpecifications,
        parsedFeatures,
      },
    };
  });
}
