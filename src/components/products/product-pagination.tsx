"use client";

import { useFilterNavigation } from "./products-filter-context";
import { buildProductsUrl } from "@/lib/url-builders";
import type { SpecFilterSelection } from "@/lib/catalog-filters";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BaseParams = {
  category?: string;
  brand?: string;
  q?: string;
  view?: string;
  filters?: SpecFilterSelection;
};

type Props = {
  currentPage: number;
  totalPages: number;
  baseParams: BaseParams;
  previousLabel: string;
  nextLabel: string;
};

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

export function ProductPagination({
  currentPage,
  totalPages,
  baseParams,
  previousLabel,
  nextLabel,
}: Props) {
  const { navigate } = useFilterNavigation();

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const url = (page: number) => buildProductsUrl({ ...baseParams, page });

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <button
          type="button"
          onClick={() => navigate(url(currentPage - 1))}
          className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </button>
      ) : (
        <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/50 px-3 text-sm text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((page, i) =>
          page === "..." ? (
            <span
              key={`dots-${i}`}
              className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : page === currentPage ? (
            <span
              key={page}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background"
            >
              {page}
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => navigate(url(page))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {page}
            </button>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <button
          type="button"
          onClick={() => navigate(url(currentPage + 1))}
          className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/50 px-3 text-sm text-muted-foreground/40">
          <span className="hidden sm:inline">{nextLabel}</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
