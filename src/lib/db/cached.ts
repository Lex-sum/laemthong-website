import { unstable_cache } from "next/cache";
import { getAllCategories, getAllBrands } from "./index";
import { getFilteredProducts, getProductFacets, type ProductFilter } from "./products";
import { getSpecsForCategory } from "./taxonomy";

export const getCachedCategories = unstable_cache(
  getAllCategories,
  ["all-categories"],
  { revalidate: 3600 },
);

export const getCachedBrands = unstable_cache(
  getAllBrands,
  ["all-brands"],
  { revalidate: 3600 },
);

export function getCachedFilteredProducts(filter: ProductFilter) {
  const key = `products:${filter.category ?? ""}:${filter.brand ?? ""}:${filter.search ?? ""}:${filter.page ?? 1}:${filter.perPage ?? 24}:${JSON.stringify(filter.specFilters ?? {})}`;
  return unstable_cache(
    () => getFilteredProducts(filter),
    [key],
    { revalidate: 3600, tags: ["products"] },
  )();
}

export function getCachedProductFacets(filter: ProductFilter & { category: string }) {
  const key = `facets:${filter.category}:${filter.brand ?? ""}:${filter.search ?? ""}:${JSON.stringify(filter.specFilters ?? {})}`;
  return unstable_cache(
    () => getProductFacets(filter),
    [key],
    { revalidate: 3600, tags: ["products"] },
  )();
}

export function getCachedSpecsForCategory(slug: string) {
  return unstable_cache(
    () => getSpecsForCategory(slug),
    [`specs:${slug}`],
    { revalidate: 3600, tags: ["products"] },
  )();
}
