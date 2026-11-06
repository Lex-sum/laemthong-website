import { FILTER_PREFIX, type SpecFilterSelection } from "@/lib/catalog-filters";

/**
 * Build a URL for the products page with optional filter parameters.
 * Shared across products page, filter bar, and pagination.
 */
export function buildProductsUrl(params: {
  category?: string;
  brand?: string;
  q?: string;
  page?: number;
  view?: string;
  /** Spec filters (only meaningful together with a category) */
  filters?: SpecFilterSelection;
}): string {
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.brand) sp.set("brand", params.brand);
  if (params.q) sp.set("q", params.q);
  if (params.category && params.filters) {
    for (const key of Object.keys(params.filters).sort()) {
      const values = params.filters[key];
      if (values.length > 0) sp.set(FILTER_PREFIX + key, values.join(","));
    }
  }
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.view && params.view !== "grid") sp.set("view", params.view);
  // Keep the commas in filter values readable
  const qs = sp.toString().replace(/%2C/g, ",");
  return `/products${qs ? `?${qs}` : ""}`;
}
