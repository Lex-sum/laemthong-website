"use client";

import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFilterNavigation } from "./products-filter-context";
import { buildProductsUrl } from "@/lib/url-builders";
import { cn } from "@/lib/utils";
import type { FilterGroup, SpecFilterSelection } from "@/lib/catalog-filters";

type BaseParams = { category: string; brand?: string; q?: string; view?: string };

const pill =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors";

/** Spec filters of the selected category: one dropdown per spec, with product counts. */
export function ProductSpecFilters({
  groups,
  selection,
  baseParams,
  labels,
}: {
  groups: FilterGroup[];
  selection: SpecFilterSelection;
  baseParams: BaseParams;
  labels: { title: string; clear: string };
}) {
  const { navigate } = useFilterNavigation();
  if (groups.length === 0) return null;

  const go = (filters: SpecFilterSelection) => navigate(buildProductsUrl({ ...baseParams, filters }));
  const toggle = (key: string, value: string, single = false) => {
    const current = selection[key] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : single ? [value] : [...current, value];
    const filters = { ...selection };
    if (next.length > 0) filters[key] = next;
    else delete filters[key];
    go(filters);
  };
  const activeCount = Object.values(selection).reduce((n, v) => n + v.length, 0);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3">
      <span className="mr-1 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{labels.title}</span>
      {groups.map((group) => {
        const selected = group.choices.filter((c) => c.selected);
        if (group.type === "boolean") {
          const choice = group.choices[0];
          return (
            <button
              key={group.key}
              type="button"
              aria-pressed={choice.selected}
              disabled={!choice.selected && choice.count === 0}
              onClick={() => toggle(group.key, choice.value)}
              className={cn(
                pill,
                choice.selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-40"
              )}
            >
              {group.name}
              <span className="tabular-nums opacity-60">{choice.count}</span>
            </button>
          );
        }
        return (
          <DropdownMenu key={group.key}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  pill,
                  selected.length > 0
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {group.name}
                {selected.length > 0 && (
                  <span className="max-w-40 truncate opacity-80">: {selected.map((c) => c.label).join(", ")}</span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {group.choices.map((choice) => (
                <DropdownMenuCheckboxItem
                  key={choice.value}
                  checked={choice.selected}
                  disabled={!choice.selected && choice.count === 0}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => toggle(group.key, choice.value)}
                  className="justify-between gap-6"
                >
                  <span>{choice.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{choice.count}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => go({})}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <X className="h-3 w-3" />
          {labels.clear}
        </button>
      )}
    </div>
  );
}
