"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  downloadTemplateAction,
  exportProductsAction,
  getProductCountAction,
} from "@/app/admin/(authenticated)/bulk-upload/actions";

type UploadZoneProps = {
  onFileSelected: (csvFile: File) => void;
};

/** Product Data step 1: choose a CSV. Images are imported separately (Product Images tab). */
export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    getProductCountAction().then(setProductCount);
  }, []);

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
    const csv = files.find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csv) setCsvFile(csv);
  }, []);

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (csvFile) onFileSelected(csvFile);
  };

  const downloadCsv = (csv: string, filename: string) => {
    // UTF-8 BOM so Excel reads Thai correctly (without it Excel guesses the Windows codepage)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    const { csv } = await downloadTemplateAction();
    downloadCsv(csv, "products-template.csv");
  };

  const handleExportProducts = async () => {
    const { csv } = await exportProductsAction();
    if (csv) {
      downloadCsv(csv, "products-export.csv");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <div className="rounded-lg border bg-muted/50 p-4 text-sm">
        <p className="font-medium">Quick Start</p>
        <p className="text-muted-foreground mt-1">
          Click <strong>Download Template</strong> to get a CSV with the
          expected format and example rows. Fill it in, upload here, and
          preview before importing.
        </p>
      </div>

      {/* CSV Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Product Data (CSV)
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
            accept=".csv"
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
              <p className="font-medium">Drop CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSV format with product data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={handleExportProducts}
            disabled={productCount === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {productCount !== null && productCount > 0
              ? `Export Products (${productCount})`
              : "Export Products"}
          </Button>
        </div>

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
            This CSV never adds, changes or removes product images &mdash; re-importing data
            keeps existing images. Upload images in the <strong>Product Images</strong> tab after
            the products exist.
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">How Columns Are Read</p>
          <p className="mt-1">
            Values are matched by the column name in the header row, so columns can be in any
            order and optional columns can be left out. A missing column or a blank cell never
            erases data: new products get an empty field and existing products keep their current
            value. Display order is automatic &mdash; new products are added at the end of the list
            (reorder them on the Products page).
          </p>
        </div>

        <div>
          <p className="font-medium text-foreground">
            CSV Columns &mdash; Required
          </p>
          <div className="mt-1 rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            slug &mdash; Unique ID (lowercase letters, numbers, dashes only)
            <br />
            category_slug &mdash; Must exist or will be auto-created
            <br />
            brand_slug &mdash; Must exist or will be auto-created
            <br />
            name_th &mdash; Product name (Thai)
          </div>
        </div>

        <div>
          <p className="font-medium text-foreground">
            CSV Columns &mdash; Optional
          </p>
          <div className="mt-1 rounded border bg-muted/30 p-3 font-mono text-xs leading-relaxed">
            short_description_th &mdash; Short description (Thai), shown on product cards
            <br />
            name_en, short_description_en &mdash; English (without them the English site
            shows Thai and the product page stays out of Google until translated)
            <br />
            description_th, description_en &mdash; Long description (short description used
            if empty)
            <br />
            featured &mdash; true/false, 1/0 or yes/no (new products default to false)
            <br />
            spec_labels_th, spec_labels_en &mdash; Pipe-separated spec labels
            <br />
            spec_values_th, spec_values_en &mdash; Pipe-separated spec values
            <br />
            features_th, features_en &mdash; Pipe-separated feature list
          </div>
          <p className="mt-2">
            Use <code className="text-xs bg-muted px-1 py-0.5 rounded">|</code>{" "}
            (pipe) to separate items, e.g.{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              Weight|Voltage|Power
            </code>
            . All spec columns must have the same number of items. Features must
            also match between Thai and English if both are provided. When updating, a language
            left blank keeps its current text.
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
              Unknown <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">category_slug</code> or{" "}
              <code className="text-xs bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">brand_slug</code> values
              will auto-create placeholder entries. Double-check spelling to
              avoid unintended entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
