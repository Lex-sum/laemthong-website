import { createSupabaseClient } from "@/lib/supabase";
import type { Product, ProductListItem, DbProduct, Locale } from "@/data/types";
import { fillDescription, fillEnglish, hasEnglish } from "@/lib/product-locale";
import type { FacetRow, SpecFilterCondition } from "@/lib/catalog-filters";

const LISTING_COLUMNS = "slug, category_slug, brand_slug, name, short_description, images, featured, sort_order" as const;

export type ProductFilter = {
  /** A main category includes its sub categories */
  category?: string;
  brand?: string;
  search?: string;
  locale?: Locale;
  page?: number;
  perPage?: number;
  /** Spec filters by attribute id (see lib/catalog-filters) */
  specFilters?: Record<string, SpecFilterCondition>;
};

/** search_products arguments; the search text is matched with ILIKE, so escape % _ \ */
function searchArgs(filter: Pick<ProductFilter, "category" | "brand" | "search" | "specFilters">) {
  return {
    p_category: filter.category || null,
    p_brand: filter.brand || null,
    p_search: filter.search ? filter.search.replace(/[%_\\]/g, "\\$&") : null,
    p_filters: filter.specFilters ?? {},
  };
}

export type PaginatedProducts = {
  products: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// English is optional for products: empty English falls back to Thai, and an empty
// long description falls back to the short description (see lib/product-locale).
function toProduct(row: DbProduct): Product {
  const shortDescription = fillEnglish(row.short_description);
  return {
    slug: row.slug,
    categorySlug: row.category_slug,
    brandSlug: row.brand_slug,
    name: fillEnglish(row.name),
    shortDescription,
    description: fillDescription(row.description, shortDescription),
    images: row.images ?? [],
    features: (row.features ?? []).map(fillEnglish),
    documents: row.documents,
    featured: row.featured,
    sortOrder: row.sort_order,
    hasEnglish: hasEnglish(row),
  };
}

function toProductListItem(row: Pick<DbProduct, "slug" | "category_slug" | "brand_slug" | "name" | "short_description" | "images" | "featured" | "sort_order">): ProductListItem {
  return {
    slug: row.slug,
    categorySlug: row.category_slug,
    brandSlug: row.brand_slug,
    name: fillEnglish(row.name),
    shortDescription: fillEnglish(row.short_description),
    images: row.images ?? [],
    featured: row.featured,
    sortOrder: row.sort_order,
    hasEnglish: hasEnglish(row),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");
  if (error) return [];
  return (data as DbProduct[]).map(toProduct);
}

export async function getFilteredProducts(filter: ProductFilter = {}): Promise<PaginatedProducts> {
  const { page = 1, perPage = 24 } = filter;
  const from = (page - 1) * perPage;
  const { data, error, count } = await createSupabaseClient()
    .rpc("search_products", searchArgs(filter), { count: "exact" })
    .select(LISTING_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true })
    .range(from, from + perPage - 1);

  if (error) return { products: [], total: 0, page, perPage, totalPages: 0 };

  const total = count ?? 0;
  return {
    products: (data as unknown as DbProduct[]).map(toProductListItem),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/** Product counts for each filter choice of a category (each spec ignores its own filter). */
export async function getProductFacets(filter: ProductFilter & { category: string }): Promise<FacetRow[]> {
  const { data, error } = await createSupabaseClient().rpc("product_facets", searchArgs(filter));
  if (error) return [];
  return data as FacetRow[];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return undefined;
  return toProduct(data as DbProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_slug", categorySlug)
    .order("sort_order");
  if (error) return [];
  return (data as DbProduct[]).map(toProduct);
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  limit = 3,
): Promise<ProductListItem[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(LISTING_COLUMNS)
    .eq("category_slug", categorySlug)
    .neq("slug", excludeSlug)
    .order("sort_order")
    .limit(limit);
  if (error) return [];
  return (data as DbProduct[]).map(toProductListItem);
}

export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(LISTING_COLUMNS)
    .eq("featured", true)
    .order("sort_order");
  if (error) return [];
  return (data as DbProduct[]).map(toProductListItem);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug");
  if (error) return [];
  return data.map((row) => row.slug);
}

export async function getProductSlugsWithDates(): Promise<
  { slug: string; updatedAt: string; hasEnglish: boolean }[]
> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at, name, short_description");
  if (error) return [];
  return data.map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
    hasEnglish: hasEnglish(row),
  }));
}
