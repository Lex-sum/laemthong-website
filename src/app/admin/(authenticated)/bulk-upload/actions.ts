"use server";

import { requireAdmin } from "@/lib/auth";
import { CSV_COLUMNS } from "@/lib/bulk-upload/csv-parser";
import { validateProductRows } from "@/lib/bulk-upload/validator";
import { buildProductWorkbook, parseProductFile } from "@/lib/bulk-upload/xlsx";
import {
  adminGetAllBrands,
  adminGetAllCategories,
  adminGetProductsForExport,
} from "@/lib/db/admin";
import { adminGetAllSpecs, adminGetSpecValuesForProducts } from "@/lib/db/taxonomy";
import type {
  ClientValidationResult,
  ValidationStats,
} from "@/lib/bulk-upload/types";

/** Parses and validates a product data CSV for the preview step. */
export async function parseAndValidateAction(formData: FormData): Promise<{
  success: boolean;
  rows?: ClientValidationResult[];
  stats?: ValidationStats;
  /** File-level notes: header columns that are ignored or left out */
  notices?: string[];
  error?: string;
}> {
  await requireAdmin();

  try {
    const csvFile = formData.get("csv") as File | null;
    if (!csvFile) {
      return { success: false, error: "An Excel or CSV file is required" };
    }

    const { rows: parsedRows, columns, ignoredColumns } = await parseProductFile(csvFile);
    if (parsedRows.length === 0) {
      return { success: false, error: "CSV file is empty or invalid" };
    }

    const validated = await validateProductRows(parsedRows);

    const stats: ValidationStats = {
      total: validated.length,
      valid: validated.filter((v) => v.status === "valid").length,
      warnings: validated.filter((v) => v.status === "warning").length,
      errors: validated.filter((v) => v.status === "error").length,
    };

    const notices: string[] = [];
    if (ignoredColumns.includes("sort_order")) {
      notices.push("Column sort_order is ignored — display order is set automatically (new products go last).");
    }
    const oldSpecColumns = ignoredColumns.filter((c) => c.startsWith("spec_labels_") || c.startsWith("spec_values_"));
    if (oldSpecColumns.length > 0) {
      notices.push(`Old spec columns are ignored (${oldSpecColumns.join(", ")}) — specs now belong to the category and are set per product.`);
    }
    const otherIgnored = ignoredColumns.filter((c) => c !== "sort_order" && !oldSpecColumns.includes(c));
    if (otherIgnored.length > 0) {
      notices.push(`Unknown column${otherIgnored.length > 1 ? "s" : ""} ignored: ${otherIgnored.join(", ")}. Check the spelling if you meant to import ${otherIgnored.length > 1 ? "them" : "it"}.`);
    }
    const leftOut = CSV_COLUMNS.filter((c) => !columns.includes(c));
    if (leftOut.length > 0) {
      notices.push(`Not in this file: ${leftOut.join(", ")}. Existing products keep their current values for these.`);
    }
    const clearing = validated.filter((v) => v.clears.length > 0).length;
    if (clearing > 0) {
      notices.push(`${clearing} existing product${clearing > 1 ? "s have" : " has"} blank cells that will clear current values when Overwrite is on (see "Will clear" below). Remove a column from the file to leave it unchanged.`);
    }

    const clientRows: ClientValidationResult[] = validated.map((v) => ({
      row: v.row,
      action: v.action,
      clears: v.clears,
      status: v.status,
      errors: v.errors,
      warnings: v.warnings,
    }));

    return { success: true, rows: clientRows, stats, notices };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to parse and validate",
    };
  }
}

/** The category, its main category (if a sub) and its sub categories (if a main). */
async function categoryFamily(slug: string) {
  const all = await adminGetAllCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) return null;
  const family = category.parent_slug ? [category] : [category, ...all.filter((c) => c.parent_slug === slug)];
  const specsByCategory = await adminGetAllSpecs();
  const specs = [
    ...(category.parent_slug ? specsByCategory.get(category.parent_slug) ?? [] : []),
    ...family.flatMap((c) => specsByCategory.get(c.slug) ?? []),
  ];
  return { category, family, specs };
}

type WorkbookResult = { base64?: string; filename?: string; count?: number; error?: string };

/** Excel template for a category: its columns, spec columns and dropdowns. */
export async function downloadTemplateAction(categorySlug: string): Promise<WorkbookResult> {
  await requireAdmin();
  const found = await categoryFamily(categorySlug);
  if (!found) return { error: "Category not found" };
  const buffer = await buildProductWorkbook({
    category: found.category,
    categories: found.family,
    brands: await adminGetAllBrands(),
    specs: found.specs,
  });
  return { base64: buffer.toString("base64"), filename: `products-template-${categorySlug}.xlsx` };
}

/** Excel export of a category's products (a main category includes its subs), same layout. */
export async function exportProductsAction(categorySlug: string): Promise<WorkbookResult> {
  await requireAdmin();
  const found = await categoryFamily(categorySlug);
  if (!found) return { error: "Category not found" };
  const slugs = new Set(found.family.map((c) => c.slug));
  const products = (await adminGetProductsForExport()).filter((p) => slugs.has(p.category_slug));
  const values = await adminGetSpecValuesForProducts(products.map((p) => p.slug));
  const buffer = await buildProductWorkbook({
    category: found.category,
    categories: found.family,
    brands: await adminGetAllBrands(),
    specs: found.specs,
    products: products.map((product) => ({ product, values: values.get(product.slug) ?? {} })),
  });
  return {
    base64: buffer.toString("base64"),
    filename: `products-${categorySlug}.xlsx`,
    count: products.length,
  };
}


