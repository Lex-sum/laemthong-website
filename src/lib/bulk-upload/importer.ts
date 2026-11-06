import {
  adminGetAllBrands,
  adminCreateBrand,
  adminCreateProduct,
  adminUpdateProduct,
  type ProductImportSnapshot,
} from "@/lib/db/admin";
import { getNextSortOrder } from "@/lib/db/sort-order";
import { adminReplaceProductSpecValues } from "@/lib/db/taxonomy";
import { specValueRows } from "@/lib/spec-values";
import type { DbProduct, LocalizedString } from "@/data/types";
import { parseFeatured, splitPipe } from "./csv-parser";
import type { ValidationResult, ImportOptions, ImportEvent, ParsedProductRow } from "./types";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Column not in the file → current value; column in the file → CSV value ("" clears). */
function pick(value: string | undefined, current: string): string {
  return value ?? current;
}

/**
 * Pipe-separated columns, item by item. A column that is in the file sets its part of every
 * item (blank clears it); a column that isn't keeps the current text at the same position.
 * The item count comes from the columns in the file, and also from the current list
 * when some columns are not in the file (so their text is never dropped).
 */
function mergeList<T>(
  columns: (string | undefined)[],
  current: T[],
  read: (item: T | undefined) => string[],
  build: (parts: string[]) => T
): T[] {
  const lists = columns.map((column) => (column === undefined ? null : splitPipe(column)));
  const keepsCurrent = lists.some((list) => list === null);
  const count = Math.max(keepsCurrent ? current.length : 0, ...lists.map((list) => list?.length ?? 0));
  return Array.from({ length: count }, (_, i) =>
    build(lists.map((list, part) => (list ? list[i] ?? "" : read(current[i])[part] ?? "")))
  );
}

/** Only the columns in the file (slug, category, brand, name_th and short_description_th always are). */
function buildUpdate(data: ParsedProductRow["data"], existing: ProductImportSnapshot) {
  const update: Partial<Omit<DbProduct, "updated_at">> = {
    category_slug: data.categorySlug,
    brand_slug: data.brandSlug,
    name: { th: data.nameTh, en: pick(data.nameEn, existing.name.en) },
    short_description: {
      th: data.shortDescriptionTh,
      en: pick(data.shortDescriptionEn, existing.short_description.en),
    },
    description: {
      th: pick(data.descriptionTh, existing.description.th),
      en: pick(data.descriptionEn, existing.description.en),
    },
  };
  const featured = parseFeatured(data.featured);
  if (typeof featured === "boolean") update.featured = featured;
  const featureColumns = [data.featuresTh, data.featuresEn];
  if (featureColumns.some((column) => column !== undefined)) {
    update.features = mergeList<LocalizedString>(
      featureColumns,
      existing.features ?? [],
      (feature) => [feature?.th ?? "", feature?.en ?? ""],
      ([th, en]) => ({ th, en })
    );
  }
  return update;
}

/**
 * Imports product DATA from CSV. Never touches images or documents: new products start
 * with none and updates leave them as they are (images have their own import).
 * Display order is automatic: new products are added after the current last product,
 * in file order; existing products keep their position.
 * Uses the product data loaded during validation, so each row costs one write.
 */
export async function* importProducts(
  validatedRows: ValidationResult[],
  options: ImportOptions
): AsyncGenerator<ImportEvent> {
  const stats = { created: 0, updated: 0, skipped: 0, failed: 0 };
  const failures: { slug: string; error: string }[] = [];
  let nextSortOrder: number | null = null;
  const brandSlugs = new Set((await adminGetAllBrands()).map((b) => b.slug));

  for (let i = 0; i < validatedRows.length; i++) {
    const result = validatedRows[i];
    const { data } = result.row;

    // Rows with errors are never imported
    if (result.status === "error") {
      stats.skipped++;
      yield {
        type: "skipped",
        slug: data.slug,
        reason: options.skipErrors ? result.errors.join("; ") : "Has validation errors",
      };
      continue;
    }

    // Loaded during validation (same request)
    const existing = result.current;
    if (existing && !options.overwriteExisting) {
      stats.skipped++;
      yield { type: "skipped", slug: data.slug, reason: "Already exists (overwrite disabled)" };
      continue;
    }

    try {
      // Auto-create brand if needed
      if (data.brandSlug && !brandSlugs.has(data.brandSlug)) {
        await adminCreateBrand({
          slug: data.brandSlug,
          name: slugToTitle(data.brandSlug),
          description: { th: "", en: "" },
          logo: "",
          website: null,
          country: "",
          sort_order: 999,
        });
        brandSlugs.add(data.brandSlug);
      }

      // Only specs whose columns are in the file (plus values a category change drops)
      const specUpdates = result.specUpdates ?? {};
      const writeSpecs = () =>
        adminReplaceProductSpecValues(data.slug, specValueRows(specUpdates), Object.keys(specUpdates));

      if (existing) {
        await adminUpdateProduct(data.slug, buildUpdate(data, existing));
        await writeSpecs();
        stats.updated++;
        yield { type: "success", slug: data.slug, action: "updated" };
      } else {
        nextSortOrder ??= await getNextSortOrder("products");
        await adminCreateProduct({
          slug: data.slug,
          category_slug: data.categorySlug,
          brand_slug: data.brandSlug,
          name: { th: data.nameTh, en: data.nameEn ?? "" },
          short_description: {
            th: data.shortDescriptionTh,
            en: data.shortDescriptionEn ?? "",
          },
          description: { th: data.descriptionTh ?? "", en: data.descriptionEn ?? "" },
          images: [],
          features: data.parsedFeatures ?? [],
          documents: [],
          featured: parseFeatured(data.featured) === true,
          sort_order: nextSortOrder,
        });
        await writeSpecs();
        nextSortOrder += 10;
        stats.created++;
        yield { type: "success", slug: data.slug, action: "created" };
      }

      // Progress update
      yield {
        type: "progress",
        current: i + 1,
        total: validatedRows.length,
        slug: data.slug,
      };
    } catch (error) {
      stats.failed++;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      failures.push({ slug: data.slug, error: errorMsg });
      yield { type: "error", slug: data.slug, error: errorMsg };
    }
  }

  yield { type: "complete", stats: { ...stats, total: validatedRows.length, failures } };
}
