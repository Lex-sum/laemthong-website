"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type {
  ClientValidationResult,
  ValidationStats,
} from "@/lib/bulk-upload/types";

type PreviewTableProps = {
  rows: ClientValidationResult[];
  stats: ValidationStats;
  onImport: (options: { overwriteExisting: boolean; skipErrors: boolean }) => void;
  onBack: () => void;
};

const ROWS_PER_PAGE = 50;

export function PreviewTable({
  rows,
  stats,
  onImport,
  onBack,
}: PreviewTableProps) {
  const [filter, setFilter] = useState<
    "all" | "valid" | "warnings" | "errors"
  >("all");
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [page, setPage] = useState(1);

  const filteredRows = rows.filter((row) => {
    if (filter === "all") return true;
    if (filter === "valid") return row.status === "valid";
    if (filter === "warnings") return row.status === "warning";
    if (filter === "errors") return row.status === "error";
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const startIndex = (page - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const canImport = stats.errors === 0 || skipErrors;
  const importCount =
    skipErrors ? stats.valid + stats.warnings : stats.total;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Valid</p>
          <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.warnings}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Errors</p>
          <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "accent" : "outline"}
          size="sm"
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === "valid" ? "accent" : "outline"}
          size="sm"
          onClick={() => {
            setFilter("valid");
            setPage(1);
          }}
        >
          Valid ({stats.valid})
        </Button>
        <Button
          variant={filter === "warnings" ? "accent" : "outline"}
          size="sm"
          onClick={() => {
            setFilter("warnings");
            setPage(1);
          }}
        >
          Warnings ({stats.warnings})
        </Button>
        <Button
          variant={filter === "errors" ? "accent" : "outline"}
          size="sm"
          onClick={() => {
            setFilter("errors");
            setPage(1);
          }}
        >
          Errors ({stats.errors})
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Line
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Brand
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.row.index} className="border-t">
                  <td className="px-4 py-3 text-sm">{row.row.index}</td>
                  <td className="px-4 py-3">
                    {row.status === "valid" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {row.status === "warning" && (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    {row.status === "error" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[150px]">
                    <div className="font-mono truncate">{row.row.data.slug}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.action === "create" ? "New" : "Existing"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate">
                    {row.row.data.nameEn || row.row.data.nameTh}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[120px] truncate">
                    {row.row.data.categorySlug}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[120px] truncate">
                    {row.row.data.brandSlug}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {(() => {
                      const specCount =
                        row.row.data.parsedSpecifications?.length || 0;
                      const featCount =
                        row.row.data.parsedFeatures?.length || 0;
                      const parts: string[] = [];
                      if (specCount > 0) parts.push(`${specCount} specs`);
                      if (featCount > 0) parts.push(`${featCount} feat.`);
                      return parts.length > 0 ? parts.join(", ") : "\u2014";
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.errors.length > 0 && (
                      <div className="space-y-1">
                        {row.errors.slice(0, 2).map((error, i) => (
                          <p key={i} className="text-red-600 text-xs">
                            {error}
                          </p>
                        ))}
                        {row.errors.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{row.errors.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                    {row.warnings.length > 0 && (
                      <div className="space-y-1">
                        {row.warnings.slice(0, 2).map((warning, i) => (
                          <p key={i} className="text-yellow-600 text-xs">
                            {warning}
                          </p>
                        ))}
                        {row.warnings.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{row.warnings.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredRows.length)} of {filteredRows.length}{" "}
            results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="overwrite"
            checked={overwriteExisting}
            onCheckedChange={(checked) =>
              setOverwriteExisting(checked as boolean)
            }
          />
          <Label htmlFor="overwrite" className="cursor-pointer">
            Overwrite existing products with same slug
          </Label>
        </div>
        {stats.errors > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="skipErrors"
              checked={skipErrors}
              onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
            />
            <Label htmlFor="skipErrors" className="cursor-pointer">
              Skip rows with errors ({stats.errors} rows)
            </Label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="accent"
          onClick={() => onImport({ overwriteExisting, skipErrors })}
          disabled={!canImport}
        >
          Import {importCount} Products
        </Button>
      </div>
    </div>
  );
}
