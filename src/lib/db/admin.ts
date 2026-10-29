import { createSupabaseAdminClient } from "@/lib/supabase";
import type { DbBrand, DbCategory, DbProduct, DbPageImage } from "@/data/types";

// ─── Brands ──────────────────────────────────────────────────────────────────

export async function adminGetAllBrands(): Promise<DbBrand[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order");
  if (error) return [];
  return data as DbBrand[];
}

export async function adminGetBrandBySlug(
  slug: string
): Promise<DbBrand | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as DbBrand;
}

export async function adminCreateBrand(
  brand: Omit<DbBrand, "updated_at">
): Promise<DbBrand> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert(brand)
    .select()
    .single();
  if (error) throw error;
  return data as DbBrand;
}

export async function adminUpdateBrand(
  slug: string,
  brand: Partial<Omit<DbBrand, "updated_at">>
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brands")
    .update(brand)
    .eq("slug", slug);
  if (error) throw error;
}

export async function adminDeleteBrand(slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brands").delete().eq("slug", slug);
  if (error) throw error;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function adminGetAllCategories(): Promise<DbCategory[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) return [];
  return data as DbCategory[];
}

export async function adminGetCategoryBySlug(
  slug: string
): Promise<DbCategory | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as DbCategory;
}

export async function adminCreateCategory(
  category: Omit<DbCategory, "updated_at">
): Promise<DbCategory> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data as DbCategory;
}

export async function adminUpdateCategory(
  slug: string,
  category: Partial<Omit<DbCategory, "updated_at">>
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .update(category)
    .eq("slug", slug);
  if (error) throw error;
}

export async function adminDeleteCategory(slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("slug", slug);
  if (error) throw error;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface AdminProductsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  brand?: string;
}

export interface AdminProductsResult {
  products: DbProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function adminGetProducts(
  query: AdminProductsQuery = {}
): Promise<AdminProductsResult> {
  const {
    page = 1,
    pageSize = 20,
    search,
    category,
    brand,
  } = query;

  const supabase = createSupabaseAdminClient();
  let q = supabase.from("products").select("*", { count: "exact" });

  // Search across name (en/th) and slug
  if (search) {
    const term = `%${search}%`;
    q = q.or(`name->>en.ilike.${term},name->>th.ilike.${term},slug.ilike.${term}`);
  }

  // Filters
  if (category) q = q.eq("category_slug", category);
  if (brand) q = q.eq("brand_slug", brand);

  // Always sort by sort_order ascending
  q = q.order("sort_order", { ascending: true });

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);

  const { data, error, count } = await q;

  if (error) {
    return { products: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    products: data as DbProduct[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function adminGetProductCount(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("products")
    .select("slug", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function adminGetProductsForExport(
  batchSize = 500
): Promise<DbProduct[]> {
  const supabase = createSupabaseAdminClient();
  const allProducts: DbProduct[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "slug,category_slug,brand_slug,name,short_description,description,specifications,features,featured,sort_order"
      )
      .order("sort_order")
      .range(from, from + batchSize - 1);

    if (error || !data || data.length === 0) break;
    allProducts.push(...(data as DbProduct[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allProducts;
}

export async function adminGetProductBySlug(
  slug: string
): Promise<DbProduct | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as DbProduct;
}

export async function adminCreateProduct(
  product: Omit<DbProduct, "updated_at">
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").insert(product);
  if (error) throw error;
}

export async function adminUpdateProduct(
  slug: string,
  product: Partial<Omit<DbProduct, "updated_at">>
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("products")
    .update(product)
    .eq("slug", slug);
  if (error) throw error;
}

export async function adminDeleteProduct(slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").delete().eq("slug", slug);
  if (error) throw error;
}

// ─── Page Images ────────────────────────────────────────────────────────────

export async function adminGetAllPageImages(): Promise<DbPageImage[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("page_images")
    .select("*")
    .order("key");
  if (error) return [];
  return data as DbPageImage[];
}

export async function adminUpsertPageImage(
  key: string,
  imageUrl: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("page_images")
    .upsert({ key, image_url: imageUrl }, { onConflict: "key" });
  if (error) throw error;
}

export async function adminDeletePageImage(key: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("page_images")
    .delete()
    .eq("key", key);
  if (error) throw error;
}

// ─── Contact Inquiries ──────────────────────────────────────────────────────

export interface ContactInquiryRow {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string | null;
  product_interest: string | null;
  message: string;
  created_at: string;
}

export interface AdminInquiriesResult {
  inquiries: ContactInquiryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function adminGetContactInquiries(
  page = 1,
  pageSize = 20,
): Promise<AdminInquiriesResult> {
  const supabase = createSupabaseAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("contact_inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { inquiries: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    inquiries: data as ContactInquiryRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function adminGetContactInquiryCount(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("contact_inquiries")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function adminDeleteContactInquiry(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("contact_inquiries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── SAP Stock ──────────────────────────────────────────────────────────────

export interface SapStockRow {
  item_code: string;
  item_name: string;
  on_hand: number;
  available: number;
  synced_at: string;
}

export interface SapStockListRow extends SapStockRow {
  /** A product exists whose slug equals item_code. */
  matched: boolean;
}

export interface AdminSapStockQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AdminSapStockResult {
  items: SapStockListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  lastSyncedAt: string | null;
}

const SAP_STOCK_COLUMNS = "item_code, item_name, on_hand, available, synced_at";

export async function adminGetSapStock(
  query: AdminSapStockQuery = {}
): Promise<AdminSapStockResult> {
  const { page = 1, pageSize = 20, search } = query;
  const supabase = createSupabaseAdminClient();

  let q = supabase.from("sap_stock").select(SAP_STOCK_COLUMNS, { count: "exact" });

  if (search) {
    const term = `%${search}%`;
    q = q.or(`item_code.ilike.${term},item_name.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [{ data, error, count }, { data: latest }] = await Promise.all([
    q.order("item_code", { ascending: true }).range(from, to),
    supabase
      .from("sap_stock")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, lastSyncedAt: null };
  }

  const rows = data as SapStockRow[];

  // One lookup for the whole page: which item codes already exist as product slugs
  const matchedSlugs = new Set<string>();
  if (rows.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("slug")
      .in("slug", rows.map((r) => r.item_code));
    for (const p of products ?? []) matchedSlugs.add(p.slug);
  }

  const total = count ?? 0;
  return {
    items: rows.map((r) => ({ ...r, matched: matchedSlugs.has(r.item_code) })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    lastSyncedAt: latest?.synced_at ?? null,
  };
}

export async function adminGetSapStockByCode(
  itemCode: string
): Promise<SapStockRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sap_stock")
    .select(SAP_STOCK_COLUMNS)
    .eq("item_code", itemCode)
    .maybeSingle();
  if (error || !data) return null;
  return data as SapStockRow;
}

export interface SapProductInfo {
  /** SAP item whose code equals the product slug. */
  match: SapStockRow | null;
  /** Other SAP items with exactly the same name as `match`. */
  sameName: SapStockRow[];
}

export async function adminGetSapInfoForSlug(slug: string): Promise<SapProductInfo> {
  const match = await adminGetSapStockByCode(slug);
  if (!match) return { match: null, sameName: [] };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sap_stock")
    .select(SAP_STOCK_COLUMNS)
    .eq("item_name", match.item_name)
    .neq("item_code", slug)
    .order("item_code", { ascending: true });

  return { match, sameName: error ? [] : (data as SapStockRow[]) };
}
