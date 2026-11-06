import { slugSchema } from "@/lib/validations/shared";
import {
  adminGetAllBrands,
  adminGetAllCategories,
  adminGetProductsBySlugs,
  type ProductImportSnapshot,
} from "@/lib/db/admin";
import { adminGetAllSpecs, adminGetSpecValuesForProducts } from "@/lib/db/taxonomy";
import { isEmptySpecValue, parseSpecCell } from "@/lib/spec-values";
import { parseFeatured } from "./csv-parser";
import type { ParsedProductRow, ValidationResult } from "./types";
import type { DbCategory, ProductSpecValues, SpecAttribute, SpecValue } from "@/data/types";

/**
 * Reads a row's spec columns against the specs of its category (main + sub). Returns the
 * values to write (null = clear), errors, and the columns whose current value gets cleared.
 */
function readSpecCells(
  data: ParsedProductRow["data"],
  specs: SpecAttribute[],
  currentValues: ProductSpecValues | undefined,
  categoryChanged: boolean
): { updates: Record<string, SpecValue | null>; errors: string[]; clears: string[] } {
  const updates: Record<string, SpecValue | null> = {};
  const errors: string[] = [];
  const clears: string[] = [];
  const byKey = new Map(specs.map((s) => [s.key, s]));
  const keys = new Set(Object.keys(data.specCells).map((k) => k.replace(/:en$/, "")));

  for (const key of keys) {
    const thCell = data.specCells[key];
    const enCell = data.specCells[`${key}:en`];
    const spec = byKey.get(key);
    if (!spec) {
      if ((thCell ?? "") !== "" || (enCell ?? "") !== "") {
        errors.push(`spec:${key} isn't a spec of category '${data.categorySlug}'`);
      }
      continue;
    }
    const current = currentValues?.[spec.id];
    // A text spec keeps the language whose column isn't in the file
    const th = thCell ?? (spec.type === "text" ? current?.text?.th ?? "" : "");
    const en = spec.type === "text" ? enCell ?? current?.text?.en ?? "" : undefined;
    const { value, error } = parseSpecCell(spec, th, en);
    if (error) {
      errors.push(`spec:${key}: ${error}`);
      continue;
    }
    updates[spec.id] = value ?? null;
    if (!value && !isEmptySpecValue(current)) clears.push(`spec:${key}`);
  }

  // Moving to another category drops the values of specs it doesn't have
  if (categoryChanged && currentValues) {
    const allowed = new Set(specs.map((s) => s.id));
    for (const id of Object.keys(currentValues)) {
      if (!allowed.has(id)) updates[id] = null;
    }
  }
  return { updates, errors, clears };
}

/** Columns where the CSV has a blank cell but the product currently has a value. */
function findClears(data: ParsedProductRow["data"], current: ProductImportSnapshot): string[] {
  const clears: string[] = [];
  const blankOver = (column: string, value: string | undefined, currentValue: boolean) => {
    if (value === "" && currentValue) clears.push(column);
  };
  const features = current.features ?? [];
  blankOver("name_en", data.nameEn, !!current.name.en);
  blankOver("short_description_en", data.shortDescriptionEn, !!current.short_description.en);
  blankOver("description_th", data.descriptionTh, !!current.description.th);
  blankOver("description_en", data.descriptionEn, !!current.description.en);
  blankOver("featured", data.featured, current.featured);
  blankOver("features_th", data.featuresTh, features.some((x) => x.th));
  blankOver("features_en", data.featuresEn, features.some((x) => x.en));
  return clears;
}

/** Validates CSV product data. Images are not part of this import. */
export async function validateProductRows(
  rows: ParsedProductRow[]
): Promise<ValidationResult[]> {
  // Fetch brands, categories and existing products once for all rows
  const slugs = rows.map((row) => row.data.slug);
  const [brands, categories, existingProducts, allSpecs, specValues] = await Promise.all([
    adminGetAllBrands(),
    adminGetAllCategories(),
    adminGetProductsBySlugs(slugs),
    adminGetAllSpecs(),
    adminGetSpecValuesForProducts(slugs),
  ]);
  const categoryBySlug = new Map<string, DbCategory>(categories.map((c) => [c.slug, c]));
  const specsOf = (slug: string): SpecAttribute[] => {
    const category = categoryBySlug.get(slug);
    if (!category) return [];
    return [...(category.parent_slug ? allSpecs.get(category.parent_slug) ?? [] : []), ...(allSpecs.get(slug) ?? [])];
  };

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
    const spec = categorySlugs.has(data.categorySlug)
      ? readSpecCells(data, specsOf(data.categorySlug), specValues.get(data.slug), !!current && current.category_slug !== data.categorySlug)
      : { updates: {}, errors: [], clears: [] };
    errors.push(...spec.errors);
    clears.push(...spec.clears);

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
      specUpdates: spec.updates,
      clears,
      status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
      errors,
      warnings,
    };
  });
}
