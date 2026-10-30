"use client";

import { useState } from "react";
import { UploadZone } from "@/components/admin/bulk-upload/upload-zone";
import { PreviewTable } from "@/components/admin/bulk-upload/preview-table";
import { ResultsSummary } from "@/components/admin/bulk-upload/results-summary";
import { parseAndValidateAction } from "@/app/admin/(authenticated)/bulk-upload/actions";
import type {
  ClientValidationResult,
  ValidationStats,
  ImportStats,
  ImportEvent,
} from "@/lib/bulk-upload/types";

type Step = "upload" | "preview" | "importing" | "results";

/** Product Data tab: CSV → preview → import. Never changes product images. */
export function ProductDataImport() {
  const [step, setStep] = useState<Step>("upload");
  const [validatedRows, setValidatedRows] = useState<ClientValidationResult[]>(
    []
  );
  // Keep the raw file so we can send it to the API route during import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [stats, setStats] = useState<ValidationStats>({
    total: 0,
    valid: 0,
    warnings: 0,
    errors: 0,
  });
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress tracking
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentSlug: "",
    stats: { created: 0, updated: 0, skipped: 0, failed: 0 },
  });

  const handleFileSelected = async (csv: File) => {
    setIsLoading(true);
    setError(null);
    setCsvFile(csv);

    try {
      const formData = new FormData();
      formData.append("csv", csv);

      const result = await parseAndValidateAction(formData);

      if (!result.success || !result.stats) {
        setError(result.error || "Failed to parse and validate");
        return;
      }

      setStats(result.stats);

      if (result.rows) {
        setValidatedRows(result.rows);
      } else {
        setError("No data returned from validation");
        return;
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (options: {
    overwriteExisting: boolean;
    skipErrors: boolean;
  }) => {
    if (!csvFile) {
      setError("CSV file is missing. Please go back and re-upload.");
      return;
    }

    setStep("importing");
    setIsLoading(true);
    setImportProgress({
      current: 0,
      total: 0,
      currentSlug: "",
      stats: { created: 0, updated: 0, skipped: 0, failed: 0 },
    });

    try {
      const formData = new FormData();
      formData.append("csv", csvFile);
      formData.append("options", JSON.stringify(options));

      const response = await fetch("/api/admin/bulk-import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Import failed (${response.status})`
        );
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const event: ImportEvent = JSON.parse(line);

            if (event.type === "progress") {
              setImportProgress((prev) => ({
                ...prev,
                current: event.current,
                total: event.total,
                currentSlug: event.slug,
              }));
            } else if (event.type === "success") {
              const key =
                event.action === "created" ? "created" : "updated";
              setImportProgress((prev) => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  [key]: prev.stats[key] + 1,
                },
              }));
            } else if (event.type === "skipped") {
              setImportProgress((prev) => ({
                ...prev,
                stats: { ...prev.stats, skipped: prev.stats.skipped + 1 },
              }));
            } else if (event.type === "error") {
              setImportProgress((prev) => ({
                ...prev,
                stats: { ...prev.stats, failed: prev.stats.failed + 1 },
              }));
            } else if (event.type === "complete") {
              setImportStats(event.stats);
              setStep("results");
            }
          } catch (e) {
            console.error("Failed to parse event:", e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("upload");
    setValidatedRows([]);
    setCsvFile(null);
    setStats({ total: 0, valid: 0, warnings: 0, errors: 0 });
    setError(null);
  };

  const handleUploadMore = () => {
    setStep("upload");
    setValidatedRows([]);
    setCsvFile(null);
    setStats({ total: 0, valid: 0, warnings: 0, errors: 0 });
    setImportStats({
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    });
    setError(null);
  };

  return (
    <div>
      <div className="max-w-6xl rounded-xl border bg-card p-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {step === "upload" && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {step === "preview" && (
          <PreviewTable
            rows={validatedRows}
            stats={stats}
            onImport={handleImport}
            onBack={handleBack}
          />
        )}

        {step === "importing" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <h2 className="text-2xl font-bold mb-2">
                Importing Products...
              </h2>
              <p className="text-muted-foreground">
                {importProgress.current} of {importProgress.total} (
                {importProgress.total > 0
                  ? Math.round(
                      (importProgress.current / importProgress.total) * 100
                    )
                  : 0}
                %)
              </p>
            </div>

            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${
                    importProgress.total > 0
                      ? (importProgress.current / importProgress.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {importProgress.stats.created}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-blue-600">
                  {importProgress.stats.updated}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {importProgress.stats.skipped}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {importProgress.stats.failed}
                </p>
              </div>
            </div>

            {importProgress.currentSlug && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Currently processing:</p>
                <p className="font-mono font-medium">
                  {importProgress.currentSlug}
                </p>
              </div>
            )}
          </div>
        )}

        {step === "results" && (
          <ResultsSummary stats={importStats} onUploadMore={handleUploadMore} />
        )}

        {isLoading && step === "upload" && (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}
