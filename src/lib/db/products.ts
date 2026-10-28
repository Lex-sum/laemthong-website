import { createSupabaseClient } from "@/lib/supabase";
import type { Product, ProductListItem, DbProduct, Locale } from "@/data/types";

const LISTING_COLUMNS = "slug, category_slug, brand_slug, name, short_description, images, featured, sort_order" as const;

export type ProductFilter = {
  category?: string;
  brand?: string;
  search?: string;
  locale?: Locale;
  page?: number;
  perPage?: number;
};

export type PaginatedProducts = {
  products: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function toProduct(row: DbProduct): Product {
  return {
    slug: row.slug,
    categorySlug: row.category_slug,
    brandSlug: row.brand_slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    images: row.images ?? [],
    specifications: row.specifications,
    features: row.features,
    documents: row.documents,
    featured: row.featured,
    sortOrder: row.sort_order,
  };
}

function toProductListItem(row: Pick<DbProduct, "slug" | "category_slug" | "brand_slug" | "name" | "short_description" | "images" | "featured" | "sort_order">): ProductListItem {
  return {
    slug: row.slug,
    categorySlug: row.category_slug,
    brandSlug: row.brand_slug,
    name: row.name,
    shortDescription: row.short_description,
    images: row.images ?? [],
    featured: row.featured,
    sortOrder: row.sort_order,
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
  const supabase = createSupabaseClient();
  const {
    category,
    brand,
    search,
    page = 1,
    perPage = 24,
  } = filter;

  let query = supabase
    .from("products")
    .select(LISTING_COLUMNS, { count: "exact" });

  if (category) query = query.eq("category_slug", category);
  if (brand) query = query.eq("brand_slug", brand);

  if (search) {
    const escaped = search.replace(/[%_\\]/g, "\\$&");
    const pattern = `%${escaped}%`;
    query = query.or(
      `name->>th.ilike.${pattern},name->>en.ilike.${pattern},short_description->>th.ilike.${pattern},short_description->>en.ilike.${pattern}`
    );
  }

  query = query.order("sort_order", { ascending: true });

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) return { products: [], total: 0, page, perPage, totalPages: 0 };

  const total = count ?? 0;
  return {
    products: (data as DbProduct[]).map(toProductListItem),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
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
  { slug: string; updatedAt: string }[]
> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at");
  if (error) return [];
  return data.map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}
