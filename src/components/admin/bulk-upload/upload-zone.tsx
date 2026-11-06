"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  downloadTemplateAction,
  exportProductsAction,
} from "@/app/admin/(authenticated)/bulk-upload/actions";

export type TemplateCategory = { slug: string; label: string; isSub: boolean };

type UploadZoneProps = {
  categories: TemplateCategory[];
  onFileSelected: (file: File) => void;
};

const isProductFile = (name: string) => /\.(xlsx|csv)$/i.test(name);

/** Product Data step 1: choose an Excel / CSV file. Images are imported separately (Product Images tab). */
export function UploadZone({ categories, onFileSelected }: UploadZoneProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [templateCategory, setTemplateCategory] = useState("");
  const [downloading, setDownloading] = useState<"template" | "export" | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files.find((f) => isProductFile(f.name));
    if (file) setCsvFile(file);
  }, []);

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (csvFile) onFileSelected(csvFile);
  };

  const downloadXlsx = (base64: string, filename: string) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const download = async (kind: "template" | "export") => {
    if (!templateCategory) return;
    setDownloading(kind);
    try {
      const result =
        kind === "template"
          ? await downloadTemplateAction(templateCategory)
          : await exportProductsAction(templateCategory);
      if (result.base64 && result.filename) downloadXlsx(result.base64, result.filename);
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Template / export per category: the spec columns depend on the category */}
      <div className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm">
        <div>
          <p className="font-medium">1. Get the Excel file for a category</p>
          <p className="mt-1 text-muted-foreground">
            The file has a column for each spec of the category, with dropdowns for the allowed
            values. A main category&apos;s file covers all of its sub categories.{" "}
            <strong>Export</strong> gives the same file filled with the current products — edit it
            and upload it back.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={templateCategory} onValueChange={setTemplateCategory}>
            <SelectTrigger className="w-72 bg-background">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug} className={c.isSub ? "pl-6" : "font-medium"}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => download("template")}
            disabled={!templateCategory || !!downloading}
            className="gap-2 bg-background"
          >
            {downloading === "template" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => download("export")}
            disabled={!templateCategory || !!downloading}
            className="gap-2 bg-background"
          >
            {downloading === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Products
          </Button>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          2. Upload the filled-in file (Excel .xlsx or CSV)
        </label>
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleCsvChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {csvFile ? (
            <div>
              <p className="font-medium">{csvFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(csvFile.size)}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">Drop the file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Excel (.xlsx) from the template, or CSV
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!csvFile}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload & Preview
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-4 border-t pt-4">
        <div>
          <p className="font-medium text-foreground">How It Works</p>
          <p className="mt-1">
            1. Upload files &rarr; 2. Preview &amp; validate &rarr; 3. Import
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">Images</p>
          <p className="mt-1">
            This import never adds, changes or removes product images &mdash; re-importing data
            keeps existing images. Upload images in the <strong>Product Images</strong> tab after
            the products exist.
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">How Columns Are Read</p>
          <p className="mt-1">
            Values are matched by the column name in the header row, so columns can be in any
            order and optional columns can be left out.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
            <li>
              <strong>Column not in the file</strong> &mdash; not changed (new products get an
              empty field).
            </li>
            <li>
              <strong>Column in the file</strong> &mdash; set to the cell value; a{" "}
              <strong>blank cell clears</strong> the current value. The preview lists every value
              that will be cleared before you import.
            </li>
          </ul>
          <p className="mt-1">
            To update only some fields, delete the other columns from the file. Display order is
            automatic &mdash; new products are added at the end of the list (reorder them on the
            Products page).
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">
            Columns &mdash; Required
          </p>
          <div className="mt-1 rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            slug &mdash; Unique ID (lowercase letters, numbers, dashes only)
            <br />
            category_slug &mdash; Must exist (main or sub category, see Categories)
            <br />
            brand_slug &mdash; Must exist or will be auto-created
            <br />
            name_th &mdash; Product name (Thai)
            <br />
            short_description_th &mdash; Short description (Thai), shown on product cards
          </div>
        </div>

        <div>
          <p className="font-medium text-foreground">
            Columns &mdash; Optional
          </p>
          <div className="mt-1 rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            name_en, short_description_en &mdash; English (without them the English site
            shows Thai and the product page stays out of Google until translated)
            <br />
            description_th, description_en &mdash; Long description (short description used
            if empty)
            <br />
            featured &mdash; true/false, 1/0 or yes/no (blank = false)
            <br />
            features_th, features_en &mdash; Pipe-separated feature list
            <br />
            spec:&lt;key&gt; &mdash; One column per spec of the category (the template has them,
            with the names in the header notes and allowed values on the Guide sheet)
          </div>
          <p className="mt-2">
            Spec values: choose from the dropdown (or type the value&apos;s Thai / English name),
            separate several values with <code className="text-xs bg-muted px-1 py-0.5 rounded">|</code>,
            numbers may include the unit (<code className="text-xs bg-muted px-1 py-0.5 rounded">200 A</code>),
            yes / no as มี / ไม่มี. A spec that doesn&apos;t belong to the row&apos;s category is an error.
          </p>
          <p className="mt-2">
            Use <code className="text-xs bg-muted px-1 py-0.5 rounded">|</code>{" "}
            (pipe) to separate items, e.g.{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              ทนทาน|ใช้งานง่าย
            </code>
            . Features must have the same number of items in Thai and English if both are
            provided. When updating, a language whose column is not in the file keeps its current
            text.
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">
            Import Options{" "}
            <span className="font-normal text-muted-foreground">
              (shown on preview step)
            </span>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
            <li>
              <strong>Overwrite existing</strong> &mdash; updates the data of products with
              matching slugs (images are kept). When off, duplicates are skipped.
            </li>
            <li>
              <strong>Skip errors</strong> &mdash; imports valid rows even if
              some have errors
            </li>
          </ul>
        </div>

        <div className="flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-100">
              Auto-creation
            </p>
            <p className="mt-0.5 text-yellow-800 dark:text-yellow-200">
              An unknown <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">brand_slug</code>{" "}
              auto-creates a placeholder brand — double-check spelling. Categories are never created
              here (they carry the product specs): an unknown{" "}
              <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">category_slug</code> is an
              error, so add it in Categories first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
