import {
  adminGetBrandBySlug,
  adminGetCategoryBySlug,
  adminGetProductBySlug,
  adminCreateBrand,
  adminCreateCategory,
  adminCreateProduct,
  adminUpdateProduct,
} from "@/lib/db/admin";
import { getNextSortOrder } from "@/lib/db/sort-order";
import type { DbProduct, LocalizedString } from "@/data/types";
import { parseFeatured } from "./csv-parser";
import type { ValidationResult, ImportOptions, ImportEvent, ParsedProductRow } from "./types";

type Spec = { label: LocalizedString; value: LocalizedString };

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** CSV value if given, otherwise the current one (blank / missing cells never erase data). */
function pick(value: string | undefined, current: string): string {
  return value ?? current;
}

/** Spec items from the CSV; a language left blank keeps the current text at the same position. */
function mergeSpecs(parsed: Spec[], current: Spec[]): Spec[] {
  return parsed.map((spec, i) => ({
    label: {
      th: spec.label.th || current[i]?.label.th || "",
      en: spec.label.en || current[i]?.label.en || "",
    },
    value: {
      th: spec.value.th || current[i]?.value.th || "",
      en: spec.value.en || current[i]?.value.en || "",
    },
  }));
}

function mergeFeatures(parsed: LocalizedString[], current: LocalizedString[]): LocalizedString[] {
  return parsed.map((feature, i) => ({
    th: feature.th || current[i]?.th || "",
    en: feature.en || current[i]?.en || "",
  }));
}

/** Only the fields the CSV fills in: name_th, category and brand are always present. */
function buildUpdate(data: ParsedProductRow["data"], existing: DbProduct) {
  const update: Partial<Omit<DbProduct, "updated_at">> = {
    category_slug: data.categorySlug,
    brand_slug: data.brandSlug,
    name: { th: data.nameTh, en: pick(data.nameEn, existing.name.en) },
    short_description: {
      th: pick(data.shortDescriptionTh, existing.short_description.th),
      en: pick(data.shortDescriptionEn, existing.short_description.en),
    },
    description: {
      th: pick(data.descriptionTh, existing.description.th),
      en: pick(data.descriptionEn, existing.description.en),
    },
  };
  const featured = parseFeatured(data.featured);
  if (typeof featured === "boolean") update.featured = featured;
  if (data.parsedSpecifications) {
    update.specifications = mergeSpecs(data.parsedSpecifications, existing.specifications ?? []);
  }
  if (data.parsedFeatures) {
    update.features = mergeFeatures(data.parsedFeatures, existing.features ?? []);
  }
  return update;
}

/**
 * Imports product DATA from CSV. Never touches images or documents: new products start
 * with none and updates leave them as they are (images have their own import).
 * Display order is automatic: new products are added after the current last product,
 * in file order; existing products keep their position.
 */
export async function* importProducts(
  validatedRows: ValidationResult[],
  options: ImportOptions
): AsyncGenerator<ImportEvent> {
  const stats = { created: 0, updated: 0, skipped: 0, failed: 0 };
  const failures: { slug: string; error: string }[] = [];
  let nextSortOrder: number | null = null;

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

    try {
      // Auto-create brand if needed
      if (data.brandSlug && !(await adminGetBrandBySlug(data.brandSlug))) {
        await adminCreateBrand({
          slug: data.brandSlug,
          name: slugToTitle(data.brandSlug),
          description: { th: "", en: "" },
          logo: "",
          website: null,
          country: "",
          sort_order: 999,
        });
      }

      // Auto-create category if needed
      if (data.categorySlug && !(await adminGetCategoryBySlug(data.categorySlug))) {
        await adminCreateCategory({
          slug: data.categorySlug,
          name: {
            th: slugToTitle(data.categorySlug),
            en: slugToTitle(data.categorySlug),
          },
          description: { th: "", en: "" },
          sort_order: 999,
        });
      }

      // Check if exists (for update vs create)
      const existing = await adminGetProductBySlug(data.slug);

      if (existing) {
        if (options.overwriteExisting) {
          await adminUpdateProduct(data.slug, buildUpdate(data, existing));
          stats.updated++;
          yield { type: "success", slug: data.slug, action: "updated" };
        } else {
          stats.skipped++;
          yield {
            type: "skipped",
            slug: data.slug,
            reason: "Already exists (overwrite disabled)",
          };
        }
      } else {
        nextSortOrder ??= await getNextSortOrder("products");
        await adminCreateProduct({
          slug: data.slug,
          category_slug: data.categorySlug,
          brand_slug: data.brandSlug,
          name: { th: data.nameTh, en: data.nameEn ?? "" },
          short_description: {
            th: data.shortDescriptionTh ?? "",
            en: data.shortDescriptionEn ?? "",
          },
          description: { th: data.descriptionTh ?? "", en: data.descriptionEn ?? "" },
          images: [],
          specifications: data.parsedSpecifications ?? [],
          features: data.parsedFeatures ?? [],
          documents: [],
          featured: parseFeatured(data.featured) === true,
          sort_order: nextSortOrder,
        });
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
