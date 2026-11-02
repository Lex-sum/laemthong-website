import type { ProductImportSnapshot } from "@/lib/db/admin";

export type ParsedSpecification = {
  label: { th: string; en: string };
  value: { th: string; en: string };
};

export type ParsedFeature = {
  th: string;
  en: string;
};

export type ParsedProductRow = {
  index: number; // Line number in the CSV file (header is line 1)
  // Optional fields: undefined = column not in the file (existing products keep their
  // value), "" = blank cell (clears the value).
  data: {
    slug: string;
    categorySlug: string;
    brandSlug: string;
    nameTh: string;
    nameEn?: string;
    shortDescriptionTh: string;
    shortDescriptionEn?: string;
    descriptionTh?: string;
    descriptionEn?: string;
    featured?: string;
    // Pipe-separated raw strings from CSV (for validation messages)
    specLabelsTh?: string;
    specLabelsEn?: string;
    specValuesTh?: string;
    specValuesEn?: string;
    featuresTh?: string;
    featuresEn?: string;
    // Parsed structured data (built from pipe-separated columns)
    parsedSpecifications?: ParsedSpecification[];
    parsedFeatures?: ParsedFeature[];
  };
};

export type ParsedCsv = {
  rows: ParsedProductRow[];
  /** Header names found in the file (trimmed, lowercase) */
  columns: string[];
  /** Header names the import doesn't use (e.g. typos or an old sort_order column) */
  ignoredColumns: string[];
};

export type ValidationStatus = "valid" | "warning" | "error";

export type ValidationResult = {
  row: ParsedProductRow;
  /** Current data of an existing product (server only — not sent to the browser) */
  current?: ProductImportSnapshot;
  /** Whether the slug already exists (update) or is new (create) */
  action: "create" | "update";
  /** Columns whose current non-empty value this row will erase (updates only) */
  clears: string[];
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
};

export type ClientValidationResult = {
  row: ParsedProductRow;
  /** Whether the slug already exists (update) or is new (create) */
  action: "create" | "update";
  /** Columns whose current non-empty value this row will erase (updates only) */
  clears: string[];
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
};

export type ValidationStats = {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
};

export type ImportOptions = {
  overwriteExisting: boolean;
  skipErrors: boolean;
};

export type ImportEvent =
  | { type: "progress"; current: number; total: number; slug: string }
  | {
      type: "success";
      slug: string;
      action: "created" | "updated";
    }
  | { type: "skipped"; slug: string; reason: string }
  | { type: "error"; slug: string; error: string }
  | { type: "complete"; stats: ImportStats };

export type ImportStats = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: { slug: string; error: string }[];
};
