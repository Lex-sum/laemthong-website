"use client";

import { useState } from "react";
import { useFilterNavigation } from "./products-filter-context";
import { buildProductsUrl } from "@/lib/url-builders";
import type { SpecFilterSelection } from "@/lib/catalog-filters";
import { X } from "lucide-react";

type Dimension = "category" | "brand";

interface ProductFilterBarProps {
  /** Main and sub categories; pills show the main ones, the selected main's subs below */
  categories: { slug: string; name: string; parentSlug: string | null }[];
  brands: { slug: string; name: string }[];
  activeCategory?: string;
  activeBrand?: string;
  activeQuery?: string;
  viewParam?: string;
  /** Spec filters of the active category (kept when the brand changes) */
  filters?: SpecFilterSelection;
  /** Spec filter row, shown under the category pills */
  specFilters?: React.ReactNode;
  labels: {
    category: string;
    brand: string;
    allCategories: string;
    allInCategory: string;
    allBrands: string;
    activeFilters: string;
    clearAll: string;
  };
  toolbar?: React.ReactNode;
}

export function ProductFilterBar({
  categories,
  brands,
  activeCategory,
  activeBrand,
  activeQuery,
  viewParam,
  filters,
  specFilters,
  labels,
  toolbar,
}: ProductFilterBarProps) {
  const mainCategories = categories.filter((c) => !c.parentSlug);
  const activeCategoryItem = categories.find((c) => c.slug === activeCategory);
  const activeMain = activeCategoryItem?.parentSlug ?? activeCategoryItem?.slug;
  const subCategories = activeMain ? categories.filter((c) => c.parentSlug === activeMain) : [];
  const { navigate } = useFilterNavigation();

  // Auto-select tab based on active filter state
  const initialTab: Dimension =
    activeBrand && !activeCategory ? "brand" : "category";
  const [activeTab, setActiveTab] = useState<Dimension>(initialTab);

  const hasActiveFilters = !!(activeCategory || activeBrand || activeQuery);

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name
    : undefined;
  const activeBrandName = activeBrand
    ? brands.find((b) => b.slug === activeBrand)?.name
    : undefined;

  const commonParams = {
    q: activeQuery,
    view: viewParam,
  };

  return (
    <div>
      {/* Tab row + toolbar + active chips */}
      <div className="flex items-end justify-between gap-4 border-b">
        {/* Dimension tabs */}
        <div className="flex shrink-0" role="tablist">
          <button
            type="button"
            role="tab"
            id="tab-category"
            aria-selected={activeTab === "category"}
            aria-controls="tabpanel-filters"
            onClick={() => setActiveTab("category")}
            className="group relative pb-3 pr-5"
          >
            <span
              className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
                activeTab === "category"
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {labels.category}
            </span>
            {/* Red underline indicator */}
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out ${
                activeTab === "category"
                  ? "w-full opacity-100"
                  : "w-0 opacity-0"
              }`}
            />
          </button>

          {/* Divider */}
          <span className="mb-3 mr-5 h-3 w-px bg-border" />

          <button
            type="button"
            role="tab"
            id="tab-brand"
            aria-selected={activeTab === "brand"}
            aria-controls="tabpanel-filters"
            onClick={() => setActiveTab("brand")}
            className="group relative pb-3 pr-5"
          >
            <span
              className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${
                activeTab === "brand"
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              {labels.brand}
            </span>
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ease-out ${
                activeTab === "brand"
                  ? "w-full opacity-100"
                  : "w-0 opacity-0"
              }`}
            />
          </button>
        </div>

        {/* Right side: active chips + toolbar */}
        <div className="hidden items-center gap-3 pb-3 sm:flex">
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {activeCategoryName && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      buildProductsUrl({
                        brand: activeBrand,
                        ...commonParams,
                      }),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
                >
                  {activeCategoryName}
                  <X className="h-3 w-3" />
                </button>
              )}
              {activeBrandName && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      buildProductsUrl({
                        category: activeCategory,
                        filters,
                        ...commonParams,
                      }),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
                >
                  {activeBrandName}
                  <X className="h-3 w-3" />
                </button>
              )}
              {activeQuery && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      buildProductsUrl({
                        category: activeCategory,
                        brand: activeBrand,
                        view: viewParam,
                      }),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
                >
                  &ldquo;{activeQuery}&rdquo;
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="text-xs font-medium text-primary hover:underline"
              >
                {labels.clearAll}
              </button>
            </div>
          )}

          {/* View toolbar */}
          {toolbar && (
            <>
              {hasActiveFilters && <span className="h-3 w-px bg-border" />}
              {toolbar}
            </>
          )}
        </div>
      </div>

      {/* Pills row */}
      <div role="tabpanel" id="tabpanel-filters" aria-labelledby={`tab-${activeTab}`} className="flex items-center gap-2 overflow-x-auto pt-4 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {activeTab === "category" ? (
          <>
            <button
              type="button"
              aria-pressed={!activeCategory}
              onClick={() =>
                navigate(
                  buildProductsUrl({
                    brand: activeBrand,
                    ...commonParams,
                  }),
                )
              }
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                !activeCategory
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {labels.allCategories}
            </button>
            {mainCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                aria-pressed={activeMain === cat.slug}
                onClick={() =>
                  navigate(
                    buildProductsUrl({
                      category: cat.slug,
                      brand: activeBrand,
                      ...commonParams,
                    }),
                  )
                }
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  activeMain === cat.slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              type="button"
              aria-pressed={!activeBrand}
              onClick={() =>
                navigate(
                  buildProductsUrl({
                    category: activeCategory,
                    filters,
                    ...commonParams,
                  }),
                )
              }
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                !activeBrand
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {labels.allBrands}
            </button>
            {brands.map((b) => (
              <button
                key={b.slug}
                type="button"
                aria-pressed={activeBrand === b.slug}
                onClick={() =>
                  navigate(
                    buildProductsUrl({
                      category: activeCategory,
                      brand: b.slug,
                      filters,
                      ...commonParams,
                    }),
                  )
                }
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  activeBrand === b.slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {b.name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Sub categories of the selected main category */}
      {activeTab === "category" && subCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {[{ slug: activeMain as string, name: labels.allInCategory }, ...subCategories].map((sub) => (
            <button
              key={sub.slug}
              type="button"
              aria-pressed={activeCategory === sub.slug}
              onClick={() =>
                navigate(buildProductsUrl({ category: sub.slug, brand: activeBrand, ...commonParams }))
              }
              className={`shrink-0 rounded-md px-3 py-1 text-sm transition-colors ${
                activeCategory === sub.slug
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {specFilters}

      {/* Mobile: active filter chips + toolbar */}
      <div className="sm:hidden">
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3">
            {activeCategoryName && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildProductsUrl({
                      brand: activeBrand,
                      ...commonParams,
                    }),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
              >
                {activeCategoryName}
                <X className="h-3 w-3" />
              </button>
            )}
            {activeBrandName && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildProductsUrl({
                      category: activeCategory,
                      filters,
                      ...commonParams,
                    }),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
              >
                {activeBrandName}
                <X className="h-3 w-3" />
              </button>
            )}
            {activeQuery && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    buildProductsUrl({
                      category: activeCategory,
                      brand: activeBrand,
                      view: viewParam,
                    }),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-sm text-foreground transition-colors hover:bg-foreground/10"
              >
                &ldquo;{activeQuery}&rdquo;
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="text-xs font-medium text-primary hover:underline"
            >
              {labels.clearAll}
            </button>
          </div>
        )}
        {toolbar && (
          <div className="flex items-center justify-between pt-3">
            {toolbar}
          </div>
        )}
      </div>
    </div>
  );
}
