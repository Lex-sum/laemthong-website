"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsTableToolbarProps {
  brandEntries: [string, string][];
  categoryEntries: [string, string][];
}

export function ProductsTableToolbar({
  brandEntries,
  categoryEntries,
}: ProductsTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
  const currentSap = searchParams.get("sap") ?? "";
  const currentLang = searchParams.get("lang") ?? "";

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync input when URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filters change
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateParams({ search: searchInput || null });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateParams]);

  const hasFilters = currentSearch || currentCategory || currentBrand || currentSap || currentLang;

  const clearFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={currentCategory || "all"}
        onValueChange={(v) =>
          updateParams({ category: v === "all" ? null : v })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categoryEntries.map(([slug, name]) => (
            <SelectItem key={slug} value={slug}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentBrand || "all"}
        onValueChange={(v) => updateParams({ brand: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All brands</SelectItem>
          {brandEntries.map(([slug, name]) => (
            <SelectItem key={slug} value={slug}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* SAP B1 match: product slug = SAP item code */}
      <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Filter by SAP B1">
        {(
          [
            ["", "All"],
            ["in", "In SAP"],
            ["out", "Not in SAP"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => updateParams({ sap: value || null })}
            aria-pressed={currentSap === value}
            className={cn(
              "rounded px-3 py-1 text-sm transition-colors",
              currentSap === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* English is optional — find products still to translate */}
      <button
        type="button"
        onClick={() => updateParams({ lang: currentLang ? null : "th-only" })}
        aria-pressed={!!currentLang}
        className={cn(
          "rounded-md border px-3 py-1.5 text-sm transition-colors",
          currentLang ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
        )}
      >
        Missing English
      </button>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
