import ExcelJS from "exceljs";
import {
  CSV_COLUMNS,
  SPEC_COLUMN_PREFIX,
  parseProductCSV,
  parseProductRecords,
  readCsvFile,
} from "./csv-parser";
import type { ParsedCsv } from "./types";
import { specCellText } from "@/lib/spec-values";
import type { DbBrand, DbCategory, DbProduct, ProductSpecValues, SpecAttribute } from "@/data/types";

/** Rows that get dropdowns in the template */
const VALIDATED_ROWS = 2000;
const PRODUCTS_SHEET = "Products";

const SPEC_TYPE_HELP: Record<SpecAttribute["type"], string> = {
  single: "Choose one (dropdown)",
  multi: "Choose several — separate with |",
  number: "Number",
  boolean: "มี / ไม่มี",
  text: "Text (TH; English in the :en column)",
};

/** Reads the first sheet (or the "Products" sheet) into header-keyed records. */
export async function readProductXlsx(buffer: ArrayBuffer): Promise<{ records: Record<string, string>[]; columns: string[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet(PRODUCTS_SHEET) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("The Excel file has no sheets");

  const header = sheet.getRow(1);
  const columns: string[] = [];
  header.eachCell({ includeEmpty: true }, (cell, col) => {
    columns[col - 1] = cell.text.trim().toLowerCase();
  });

  const records: Record<string, string>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const record: Record<string, string> = {};
    let hasValue = false;
    columns.forEach((name, i) => {
      if (!name) return;
      const text = row.getCell(i + 1).text.trim();
      record[name] = text;
      if (text) hasValue = true;
    });
    if (hasValue) records.push(record);
  }
  return { records, columns: columns.filter(Boolean) };
}

export type WorkbookInput = {
  /** Category the file is for: its own and (for a main category) its subs' rows */
  category: DbCategory;
  /** The category and its sub categories (allowed in category_slug) */
  categories: DbCategory[];
  brands: DbBrand[];
  /** Specs of the main category and of every sub category in `categories` */
  specs: SpecAttribute[];
  /** Products to export (empty for a blank template) */
  products?: { product: DbProduct; values: ProductSpecValues }[];
};

/** Columns for the category: base columns, then one per spec (text specs also get :en). */
function specColumns(specs: SpecAttribute[]): { header: string; spec: SpecAttribute; en: boolean }[] {
  return specs.flatMap((spec) => [
    { header: SPEC_COLUMN_PREFIX + spec.key, spec, en: false },
    ...(spec.type === "text" ? [{ header: `${SPEC_COLUMN_PREFIX}${spec.key}:en`, spec, en: true }] : []),
  ]);
}

/** Product template / export for one category, with dropdowns for fixed choices. */
export async function buildProductWorkbook(input: WorkbookInput): Promise<Buffer> {
  const { category, categories, brands, specs, products = [] } = input;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Laemthong admin";
  const sheet = workbook.addWorksheet(PRODUCTS_SHEET, { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  const lists = workbook.addWorksheet("Lists", { state: "hidden" });
  const guide = workbook.addWorksheet("Guide");

  const extra = specColumns(specs);
  const headers = [...CSV_COLUMNS, ...extra.map((c) => c.header)];
  sheet.addRow(headers);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell, col) => {
    const column = extra[col - 1 - CSV_COLUMNS.length];
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: column ? "FFFDE68A" : "FFE5E7EB" } };
    if (column) {
      const s = column.spec;
      cell.note = `${s.name.th}${s.name.en ? ` / ${s.name.en}` : ""}${s.unit ? ` (${s.unit})` : ""}${column.en ? " — English" : ""}\n${SPEC_TYPE_HELP[s.type]}`;
    }
  });
  headers.forEach((h, i) => {
    sheet.getColumn(i + 1).width = Math.min(40, Math.max(14, h.length + 2));
  });

  // Rows (export)
  for (const { product, values } of products) {
    sheet.addRow([
      product.slug,
      product.category_slug,
      product.brand_slug,
      product.name.th,
      product.name.en,
      product.short_description.th,
      product.short_description.en,
      product.description.th,
      product.description.en,
      String(product.featured),
      (product.features ?? []).map((f) => f.th).join("|"),
      (product.features ?? []).map((f) => f.en).join("|"),
      ...extra.map((c) => {
        const text = specCellText(c.spec, values[c.spec.id]);
        return c.en ? text.en : text.th;
      }),
    ]);
  }
  // Keep every cell as text so Excel doesn't turn codes or "3/4" into numbers / dates
  for (let c = 1; c <= headers.length; c++) sheet.getColumn(c).numFmt = "@";

  // Dropdown lists (hidden sheet) + validations
  const listColumns: { values: string[]; target: number }[] = [
    { values: categories.map((c) => c.slug), target: headers.indexOf("category_slug") + 1 },
    { values: brands.map((b) => b.slug), target: headers.indexOf("brand_slug") + 1 },
    { values: ["true", "false"], target: headers.indexOf("featured") + 1 },
    ...extra
      .map((c, i) => ({ c, target: CSV_COLUMNS.length + i + 1 }))
      .filter(({ c }) => !c.en && (c.spec.type === "single" || c.spec.type === "boolean"))
      .map(({ c, target }) => ({
        values: c.spec.type === "boolean" ? ["มี", "ไม่มี"] : c.spec.options.map((o) => o.label.th),
        target,
      })),
  ];
  // Range validations exist at runtime but are missing from the exceljs typings
  const validations = (sheet as unknown as { dataValidations: { add: (range: string, v: ExcelJS.DataValidation) => void } })
    .dataValidations;
  listColumns.forEach(({ values, target }, i) => {
    if (values.length === 0 || target < 1) return;
    const listCol = lists.getColumn(i + 1);
    values.forEach((v, r) => {
      lists.getCell(r + 1, i + 1).value = v;
    });
    const letter = listCol.letter;
    const targetLetter = sheet.getColumn(target).letter;
    validations.add(`${targetLetter}2:${targetLetter}${VALIDATED_ROWS}`, {
      type: "list",
      allowBlank: true,
      formulae: [`Lists!$${letter}$1:$${letter}$${values.length}`],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Not in the list",
      error: "Choose a value from the list (or check the Guide sheet).",
    });
  });

  // Guide
  guide.columns = [
    { header: "Column", key: "column", width: 30 },
    { header: "Name (TH)", key: "th", width: 28 },
    { header: "Name (EN)", key: "en", width: 28 },
    { header: "How to fill", key: "how", width: 36 },
    { header: "Allowed values", key: "values", width: 70 },
  ];
  guide.getRow(1).font = { bold: true };
  guide.addRow({ column: `Category: ${category.name.th} (${category.slug})` }).font = { bold: true, size: 13 };
  guide.addRow({
    column: "Required: slug, category_slug, brand_slug, name_th, short_description_th. A column left out of the file isn't changed; a blank cell in an included column clears the value.",
  });
  guide.addRow({});
  for (const c of extra) {
    const s = c.spec;
    const sub = categories.find((x) => x.slug === s.categorySlug);
    guide.addRow({
      column: c.header,
      th: `${s.name.th}${c.en ? " (EN)" : ""}`,
      en: s.name.en,
      how: `${SPEC_TYPE_HELP[s.type]}${s.unit ? ` — unit ${s.unit}` : ""}${sub && sub.slug !== category.slug && sub.parent_slug ? ` — only for ${sub.name.th}` : ""}`,
      values:
        s.type === "single" || s.type === "multi"
          ? s.options.map((o) => o.label.th).join(", ") || "(no values defined yet)"
          : s.type === "boolean"
            ? "มี, ไม่มี"
            : "",
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Parses an uploaded product file: Excel (.xlsx) or CSV. */
export async function parseProductFile(file: File): Promise<ParsedCsv> {
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    const { records, columns } = await readProductXlsx(await file.arrayBuffer());
    return parseProductRecords(records, columns);
  }
  return parseProductCSV(await readCsvFile(file));
}
