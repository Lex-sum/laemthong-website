"use server";

import { requireAdmin } from "@/lib/auth";
import { parseProductCSV } from "@/lib/bulk-upload/csv-parser";
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
  error?: string;
}> {
  await requireAdmin();

  try {
    const csvFile = formData.get("csv") as File | null;
    if (!csvFile) {
      return { success: false, error: "A CSV file is required" };
    }

    const parsedRows = parseProductCSV(await csvFile.text());
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

    const clientRows: ClientValidationResult[] = validated.map((v) => ({
      row: v.row,
      status: v.status,
      errors: v.errors,
      warnings: v.warnings,
    }));

    return { success: true, rows: clientRows, stats };
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

const CSV_HEADERS = [
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
  "sort_order",
  "spec_labels_th",
  "spec_labels_en",
  "spec_values_th",
  "spec_values_en",
  "features_th",
  "features_en",
];

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
    "1",
    "น้ำหนัก|แรงดันไฟฟ้า|กำลังไฟ",
    "Weight|Voltage|Power",
    "50 กก.|220V|3000 วัตต์",
    "50 kg|220V|3000 W",
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
    "2",
    "",
    "",
    "",
    "",
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
    const specs = (p.specifications || []) as {
      label: { th: string; en: string };
      value: { th: string; en: string };
    }[];
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
      String(p.sort_order),
      specs.map((s) => s.label.th).join("|"),
      specs.map((s) => s.label.en).join("|"),
      specs.map((s) => s.value.th).join("|"),
      specs.map((s) => s.value.en).join("|"),
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
