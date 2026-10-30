import { productSchema } from "@/lib/validations/product";
import {
  adminGetAllBrands,
  adminGetAllCategories,
} from "@/lib/db/admin";
import type { ParsedProductRow, ValidationResult } from "./types";

/** Validates CSV product data. Images are not part of this import. */
export async function validateProductRows(
  rows: ParsedProductRow[]
): Promise<ValidationResult[]> {
  // Fetch brands and categories once for all validations
  const [brands, categories] = await Promise.all([
    adminGetAllBrands(),
    adminGetAllCategories(),
  ]);

  const brandSlugs = new Set(brands.map((b) => b.slug));
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const seenSlugs = new Set<string>();

  return rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Zod validation
    const validated = productSchema.safeParse(row.data);
    if (!validated.success) {
      errors.push(
        ...validated.error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        )
      );
    }

    // Foreign key validation with auto-creation tracking
    if (row.data.brandSlug && !brandSlugs.has(row.data.brandSlug)) {
      warnings.push(
        `Brand '${row.data.brandSlug}' will be auto-created with minimal data`
      );
      brandSlugs.add(row.data.brandSlug); // Mark for creation
    }

    if (row.data.categorySlug && !categorySlugs.has(row.data.categorySlug)) {
      warnings.push(
        `Category '${row.data.categorySlug}' will be auto-created with minimal data`
      );
      categorySlugs.add(row.data.categorySlug); // Mark for creation
    }

    // Duplicate slug detection
    if (seenSlugs.has(row.data.slug)) {
      errors.push(`Duplicate slug '${row.data.slug}' in this batch`);
    }
    seenSlugs.add(row.data.slug);

    // Specification column count validation
    if (
      row.data.specLabelsTh ||
      row.data.specLabelsEn ||
      row.data.specValuesTh ||
      row.data.specValuesEn
    ) {
      const counts: Record<string, number> = {};
      if (row.data.specLabelsTh) counts.spec_labels_th = row.data.specLabelsTh.split("|").length;
      if (row.data.specLabelsEn) counts.spec_labels_en = row.data.specLabelsEn.split("|").length;
      if (row.data.specValuesTh) counts.spec_values_th = row.data.specValuesTh.split("|").length;
      if (row.data.specValuesEn) counts.spec_values_en = row.data.specValuesEn.split("|").length;

      const entries = Object.entries(counts);
      if (entries.length > 1) {
        const firstCount = entries[0][1];
        const hasMismatch = entries.some(([, v]) => v !== firstCount);
        if (hasMismatch) {
          const detail = entries.map(([col, count]) => `${col}: ${count}`).join(", ");
          errors.push(`Specification column count mismatch (${detail})`);
        }
      }

      const hasTh = row.data.specLabelsTh || row.data.specValuesTh;
      const hasEn = row.data.specLabelsEn || row.data.specValuesEn;
      if (hasTh && !hasEn) {
        warnings.push("Specifications have Thai data but no English translations");
      }
      if (hasEn && !hasTh) {
        warnings.push("Specifications have English data but no Thai translations");
      }
    }

    // Feature column count validation
    if (row.data.featuresTh || row.data.featuresEn) {
      const thCount = row.data.featuresTh ? row.data.featuresTh.split("|").length : 0;
      const enCount = row.data.featuresEn ? row.data.featuresEn.split("|").length : 0;

      if (thCount > 0 && enCount > 0 && thCount !== enCount) {
        errors.push(
          `Feature column count mismatch: features_th has ${thCount} items but features_en has ${enCount}`
        );
      }
      if (row.data.featuresTh && !row.data.featuresEn) {
        warnings.push("Features have Thai data but no English translations");
      }
      if (row.data.featuresEn && !row.data.featuresTh) {
        warnings.push("Features have English data but no Thai translations");
      }
    }

    return {
      row,
      status:
        errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
      errors,
      warnings,
    };
  });
}
