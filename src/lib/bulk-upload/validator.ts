import { slugSchema } from "@/lib/validations/shared";
import {
  adminGetAllBrands,
  adminGetAllCategories,
  adminGetProductsBySlugs,
  type ProductImportSnapshot,
} from "@/lib/db/admin";
import { parseFeatured } from "./csv-parser";
import type { ParsedProductRow, ValidationResult } from "./types";

/** Columns where the CSV has a blank cell but the product currently has a value. */
function findClears(data: ParsedProductRow["data"], current: ProductImportSnapshot): string[] {
  const clears: string[] = [];
  const blankOver = (column: string, value: string | undefined, currentValue: boolean) => {
    if (value === "" && currentValue) clears.push(column);
  };
  const specs = current.specifications ?? [];
  const features = current.features ?? [];
  blankOver("name_en", data.nameEn, !!current.name.en);
  blankOver("short_description_en", data.shortDescriptionEn, !!current.short_description.en);
  blankOver("description_th", data.descriptionTh, !!current.description.th);
  blankOver("description_en", data.descriptionEn, !!current.description.en);
  blankOver("featured", data.featured, current.featured);
  blankOver("spec_labels_th", data.specLabelsTh, specs.some((x) => x.label.th));
  blankOver("spec_labels_en", data.specLabelsEn, specs.some((x) => x.label.en));
  blankOver("spec_values_th", data.specValuesTh, specs.some((x) => x.value.th));
  blankOver("spec_values_en", data.specValuesEn, specs.some((x) => x.value.en));
  blankOver("features_th", data.featuresTh, features.some((x) => x.th));
  blankOver("features_en", data.featuresEn, features.some((x) => x.en));
  return clears;
}

/** Validates CSV product data. Images are not part of this import. */
export async function validateProductRows(
  rows: ParsedProductRow[]
): Promise<ValidationResult[]> {
  // Fetch brands, categories and existing products once for all rows
  const [brands, categories, existingProducts] = await Promise.all([
    adminGetAllBrands(),
    adminGetAllCategories(),
    adminGetProductsBySlugs(rows.map((row) => row.data.slug)),
  ]);

  const brandSlugs = new Set(brands.map((b) => b.slug));
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const existing = new Map(existingProducts.map((p) => [p.slug, p]));
  const seenSlugs = new Set<string>();

  return rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { data } = row;
    const current = existing.get(data.slug);
    const action = current ? "update" : "create";
    const clears = current ? findClears(data, current) : [];

    // Required cells
    if (!data.slug) {
      errors.push("slug is required");
    } else {
      const slug = slugSchema.safeParse(data.slug);
      if (!slug.success) errors.push(`slug: ${slug.error.issues[0].message}`);
    }
    if (!data.categorySlug) errors.push("category_slug is required");
    if (!data.brandSlug) errors.push("brand_slug is required");
    if (!data.nameTh) errors.push("name_th is required");
    if (!data.shortDescriptionTh) errors.push("short_description_th is required");

    if (parseFeatured(data.featured) === null) {
      errors.push(`featured must be true/false, 1/0 or yes/no (got '${data.featured}')`);
    }

    if (clears.length > 0) {
      warnings.push(`Will clear: ${clears.join(", ")}`);
    }

    // Foreign key validation with auto-creation tracking
    if (data.brandSlug && !brandSlugs.has(data.brandSlug)) {
      warnings.push(`Brand '${data.brandSlug}' will be auto-created with minimal data`);
      brandSlugs.add(data.brandSlug); // Mark for creation
    }

    // Categories carry the product specs, so they are never auto-created
    if (data.categorySlug && !categorySlugs.has(data.categorySlug)) {
      errors.push(`Category '${data.categorySlug}' doesn't exist — add it in Categories first`);
    }

    // Duplicate slug detection
    if (data.slug && seenSlugs.has(data.slug)) {
      errors.push(`Duplicate slug '${data.slug}' in this file`);
    }
    seenSlugs.add(data.slug);

    // Specification column count validation
    if (data.specLabelsTh || data.specLabelsEn || data.specValuesTh || data.specValuesEn) {
      const counts: Record<string, number> = {};
      if (data.specLabelsTh) counts.spec_labels_th = data.specLabelsTh.split("|").length;
      if (data.specLabelsEn) counts.spec_labels_en = data.specLabelsEn.split("|").length;
      if (data.specValuesTh) counts.spec_values_th = data.specValuesTh.split("|").length;
      if (data.specValuesEn) counts.spec_values_en = data.specValuesEn.split("|").length;

      const entries = Object.entries(counts);
      if (entries.length > 1) {
        const firstCount = entries[0][1];
        const hasMismatch = entries.some(([, v]) => v !== firstCount);
        if (hasMismatch) {
          const detail = entries.map(([col, count]) => `${col}: ${count}`).join(", ");
          errors.push(`Specification column count mismatch (${detail})`);
        }
      }
    }

    // Feature column count validation
    if (data.featuresTh && data.featuresEn) {
      const thCount = data.featuresTh.split("|").length;
      const enCount = data.featuresEn.split("|").length;
      if (thCount !== enCount) {
        errors.push(
          `Feature column count mismatch: features_th has ${thCount} items but features_en has ${enCount}`
        );
      }
    }

    return {
      row,
      action,
      current,
      clears,
      status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
      errors,
      warnings,
    };
  });
}
