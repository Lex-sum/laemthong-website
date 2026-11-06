"use server";

import { requireAdmin } from "@/lib/auth";
import { CSV_COLUMNS, parseProductCSV, readCsvFile } from "@/lib/bulk-upload/csv-parser";
import { validateProductRows } from "@/lib/bulk-upload/validator";
import { adminGetProductsForExport, adminGetProductCount } from "@/lib/db/admin";
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
      return { success: false, error: "A CSV file is required" };
    }

    const { rows: parsedRows, columns, ignoredColumns } = parseProductCSV(
      await readCsvFile(csvFile)
    );
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

function csvEscapeRow(values: string[]): string {
  return values
    .map((v) => {
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    })
    .join(",");
}

const CSV_HEADERS = CSV_COLUMNS;

export async function downloadTemplateAction(): Promise<{ csv: string }> {
  await requireAdmin();

  const row1 = csvEscapeRow([
    "example-product-1",
    "welding-machines",
    "lincoln-electric",
    "ชื่อผลิตภัณฑ์",
    "Product Name",
    "คำอธิบายสั้น",
    "Short description here",
    "คำอธิบายยาว",
    "Long description here",
    "false",
    "ประหยัดพลังงาน|ทนทาน",
    "Energy efficient|Durable",
  ]);

  const row2 = csvEscapeRow([
    "example-product-2",
    "cutting-equipment",
    "harris",
    "ชื่อสินค้า",
    "Another Product",
    "รายละเอียดย่อ",
    "Brief details",
    "รายละเอียดเต็ม",
    "Full details",
    "true",
    "ใช้งานง่าย",
    "Easy to use",
  ]);

  return { csv: `${CSV_HEADERS.join(",")}\n${row1}\n${row2}` };
}

export async function exportProductsAction(): Promise<{
  csv: string | null;
  count: number;
}> {
  await requireAdmin();

  const products = await adminGetProductsForExport();

  if (products.length === 0) {
    return { csv: null, count: 0 };
  }

  const rows = products.map((p) => {
    const feats = (p.features || []) as { th: string; en: string }[];

    return csvEscapeRow([
      p.slug,
      p.category_slug,
      p.brand_slug,
      (p.name as { th: string; en: string }).th,
      (p.name as { th: string; en: string }).en,
      (p.short_description as { th: string; en: string }).th,
      (p.short_description as { th: string; en: string }).en,
      (p.description as { th: string; en: string }).th,
      (p.description as { th: string; en: string }).en,
      String(p.featured),
      feats.map((f) => f.th).join("|"),
      feats.map((f) => f.en).join("|"),
    ]);
  });

  return {
    csv: [CSV_HEADERS.join(","), ...rows].join("\n"),
    count: products.length,
  };
}

export async function getProductCountAction(): Promise<number> {
  await requireAdmin();

  return adminGetProductCount();
}
