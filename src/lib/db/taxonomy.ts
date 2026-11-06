import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, createSupabaseClient } from "@/lib/supabase";
import type {
  DbCategory,
  LocalizedString,
  ProductSpecValues,
  SpecAttribute,
  SpecBucket,
  SpecType,
} from "@/data/types";
import type { SpecValueRow } from "@/lib/spec-values";

// ─── Rows / mapping ──────────────────────────────────────────────────────────

type DbSpecOption = { id: string; key: string; label: LocalizedString; sort_order: number };

type DbSpecAttribute = {
  id: string;
  category_slug: string;
  key: string;
  name: LocalizedString;
  type: SpecType;
  unit: string;
  filterable: boolean;
  buckets: SpecBucket[];
  sort_order: number;
  spec_options?: DbSpecOption[];
};

type DbSpecValue = {
  attribute_id: string;
  option_id: string | null;
  number_value: number | string | null;
  bool_value: boolean | null;
  text_value: LocalizedString | null;
};

const ATTRIBUTE_COLUMNS =
  "id, category_slug, key, name, type, unit, filterable, buckets, sort_order, spec_options(id, key, label, sort_order)";

function toSpecAttribute(row: DbSpecAttribute): SpecAttribute {
  return {
    id: row.id,
    categorySlug: row.category_slug,
    key: row.key,
    name: row.name,
    type: row.type,
    unit: row.unit,
    filterable: row.filterable,
    buckets: row.buckets ?? [],
    sortOrder: row.sort_order,
    options: [...(row.spec_options ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ id: o.id, key: o.key, label: o.label, sortOrder: o.sort_order })),
  };
}

/** Category chain from main to the given category: [main] or [main, sub]. */
export function categoryChain(slug: string, categories: Pick<DbCategory, "slug" | "parent_slug">[]): string[] {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return [];
  return category.parent_slug ? [category.parent_slug, slug] : [slug];
}

/** Specs of the given categories, in chain order (main category's specs first). */
async function fetchSpecs(client: SupabaseClient, chain: string[]): Promise<SpecAttribute[]> {
  if (chain.length === 0) return [];
  const { data, error } = await client
    .from("spec_attributes")
    .select(ATTRIBUTE_COLUMNS)
    .in("category_slug", chain)
    .order("sort_order");
  if (error) throw error;
  return (data as DbSpecAttribute[])
    .map(toSpecAttribute)
    .sort((a, b) => chain.indexOf(a.categorySlug) - chain.indexOf(b.categorySlug) || a.sortOrder - b.sortOrder);
}

function toSpecValues(rows: DbSpecValue[]): ProductSpecValues {
  const values: ProductSpecValues = {};
  for (const row of rows) {
    const value = (values[row.attribute_id] ??= {});
    if (row.option_id) (value.optionIds ??= []).push(row.option_id);
    if (row.number_value !== null) value.number = Number(row.number_value);
    if (row.bool_value !== null) value.bool = row.bool_value;
    if (row.text_value) value.text = row.text_value;
  }
  return values;
}

// ─── Public reads ────────────────────────────────────────────────────────────

/** Specs that apply to a category: its main category's specs, then its own. */
export async function getSpecsForCategory(slug: string): Promise<SpecAttribute[]> {
  const client = createSupabaseClient();
  const { data } = await client.from("categories").select("slug, parent_slug").eq("slug", slug).maybeSingle();
  if (!data) return [];
  try {
    return await fetchSpecs(client, data.parent_slug ? [data.parent_slug, slug] : [slug]);
  } catch {
    return []; // taxonomy tables not migrated yet
  }
}

export async function getProductSpecValues(productSlug: string): Promise<ProductSpecValues> {
  const { data, error } = await createSupabaseClient()
    .from("product_spec_values")
    .select("attribute_id, option_id, number_value, bool_value, text_value")
    .eq("product_slug", productSlug);
  if (error) return {};
  return toSpecValues(data as DbSpecValue[]);
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/** Specs a category defines itself, and (for a sub category) those inherited from its main. */
export async function adminGetCategorySpecs(
  category: Pick<DbCategory, "slug" | "parent_slug">
): Promise<{ own: SpecAttribute[]; inherited: SpecAttribute[] }> {
  const client = createSupabaseAdminClient();
  const [own, inherited] = await Promise.all([
    fetchSpecs(client, [category.slug]),
    category.parent_slug ? fetchSpecs(client, [category.parent_slug]) : Promise.resolve([]),
  ]);
  return { own, inherited };
}

/** Specs for every category in one query: category slug → its own specs. */
export async function adminGetAllSpecs(): Promise<Map<string, SpecAttribute[]>> {
  const { data, error } = await createSupabaseAdminClient()
    .from("spec_attributes")
    .select(ATTRIBUTE_COLUMNS)
    .order("sort_order");
  const map = new Map<string, SpecAttribute[]>();
  if (error) return map; // taxonomy tables not migrated yet
  for (const attribute of (data as DbSpecAttribute[]).map(toSpecAttribute)) {
    map.set(attribute.categorySlug, [...(map.get(attribute.categorySlug) ?? []), attribute]);
  }
  return map;
}

/** How many products use each spec and each option. */
export async function adminGetSpecUsage(
  attributeIds: string[]
): Promise<{ attributes: Record<string, number>; options: Record<string, number> }> {
  const usage = { attributes: {} as Record<string, number>, options: {} as Record<string, number> };
  if (attributeIds.length === 0) return usage;
  const client = createSupabaseAdminClient();
  const seen = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("product_spec_values")
      .select("product_slug, attribute_id, option_id")
      .in("attribute_id", attributeIds)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data ?? []) {
      const productAttribute = `${row.product_slug}:${row.attribute_id}`;
      if (!seen.has(productAttribute)) {
        seen.add(productAttribute);
        usage.attributes[row.attribute_id] = (usage.attributes[row.attribute_id] ?? 0) + 1;
      }
      if (row.option_id) usage.options[row.option_id] = (usage.options[row.option_id] ?? 0) + 1;
    }
    if (!data || data.length < 1000) return usage;
  }
}

/** Product counts per category slug (direct assignments only). */
export async function adminGetCategoryProductCounts(): Promise<Record<string, number>> {
  const client = createSupabaseAdminClient();
  const counts: Record<string, number> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("products")
      .select("category_slug")
      .order("slug")
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data ?? []) counts[row.category_slug] = (counts[row.category_slug] ?? 0) + 1;
    if (!data || data.length < 1000) return counts;
  }
}

export type CategoryCounts = { productCount: number; subCount: number; specCount: number };

/** Adds sub / spec / product counts; a main category's product count includes its subs. */
export async function withCategoryCounts<T extends DbCategory>(
  categories: T[],
  all: DbCategory[]
): Promise<(T & CategoryCounts)[]> {
  const [productCounts, specs] = await Promise.all([adminGetCategoryProductCounts(), adminGetAllSpecs()]);
  return categories.map((category) => {
    const subs = all.filter((c) => c.parent_slug === category.slug);
    return {
      ...category,
      subCount: subs.length,
      specCount: specs.get(category.slug)?.length ?? 0,
      productCount: [category, ...subs].reduce((n, c) => n + (productCounts[c.slug] ?? 0), 0),
    };
  });
}

export type SpecAttributeInput = {
  id?: string;
  categorySlug: string;
  key: string;
  name: LocalizedString;
  type: SpecType;
  unit: string;
  filterable: boolean;
  buckets: SpecBucket[];
  /** Full list for single / multi specs; options left out are deleted */
  options: { id?: string; key: string; label: LocalizedString }[];
};

/** Creates or updates a spec and syncs its options (in list order). Returns the spec id. */
export async function adminSaveSpecAttribute(input: SpecAttributeInput): Promise<string> {
  const client = createSupabaseAdminClient();
  const row = {
    category_slug: input.categorySlug,
    key: input.key,
    name: input.name,
    type: input.type,
    unit: input.unit,
    filterable: input.filterable,
    buckets: input.buckets,
    updated_at: new Date().toISOString(),
  };

  let id = input.id;
  if (id) {
    const { error } = await client.from("spec_attributes").update(row).eq("id", id);
    if (error) throw error;
  } else {
    const { data: last } = await client
      .from("spec_attributes")
      .select("sort_order")
      .eq("category_slug", input.categorySlug)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await client
      .from("spec_attributes")
      .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  const usesOptions = input.type === "single" || input.type === "multi";
  const options = usesOptions ? input.options : [];
  const { data: existing, error: listError } = await client
    .from("spec_options")
    .select("id")
    .eq("attribute_id", id);
  if (listError) throw listError;
  const keep = new Set(options.filter((o) => o.id).map((o) => o.id));
  const removed = (existing ?? []).map((o) => o.id as string).filter((optionId) => !keep.has(optionId));
  if (removed.length > 0) {
    const { error } = await client.from("spec_options").delete().in("id", removed);
    if (error) throw error;
  }

  // Two passes so renaming keys between options can't collide on the unique (attribute, key)
  const updates = options.filter((o) => o.id);
  for (const option of updates) {
    const { error } = await client
      .from("spec_options")
      .update({ key: `tmp-${option.id}` })
      .eq("id", option.id);
    if (error) throw error;
  }
  for (const [index, option] of options.entries()) {
    const values = { key: option.key, label: option.label, sort_order: (index + 1) * 10 };
    const { error } = option.id
      ? await client.from("spec_options").update(values).eq("id", option.id)
      : await client.from("spec_options").insert({ ...values, attribute_id: id });
    if (error) throw error;
  }
  return id;
}

export async function adminDeleteSpecAttribute(id: string): Promise<void> {
  const { error } = await createSupabaseAdminClient().from("spec_attributes").delete().eq("id", id);
  if (error) throw error;
}

export async function adminReorderSpecAttributes(categorySlug: string, ids: string[]): Promise<void> {
  const client = createSupabaseAdminClient();
  for (const [index, id] of ids.entries()) {
    const { error } = await client
      .from("spec_attributes")
      .update({ sort_order: (index + 1) * 10 })
      .eq("id", id)
      .eq("category_slug", categorySlug);
    if (error) throw error;
  }
}

/** Specs a product in this category can have (main category's first). */
export async function adminGetSpecsForCategory(
  slug: string,
  categories: Pick<DbCategory, "slug" | "parent_slug">[]
): Promise<SpecAttribute[]> {
  return fetchSpecs(createSupabaseAdminClient(), categoryChain(slug, categories));
}

export async function adminGetProductSpecValues(productSlug: string): Promise<ProductSpecValues> {
  const { data, error } = await createSupabaseAdminClient()
    .from("product_spec_values")
    .select("attribute_id, option_id, number_value, bool_value, text_value")
    .eq("product_slug", productSlug);
  if (error) return {};
  return toSpecValues(data as DbSpecValue[]);
}

/**
 * Replaces a product's spec values. With `attributeIds`, only those specs are replaced
 * (a partial import); without, every value of the product is replaced.
 */
export async function adminReplaceProductSpecValues(
  productSlug: string,
  rows: SpecValueRow[],
  attributeIds?: string[]
): Promise<void> {
  const client = createSupabaseAdminClient();
  let remove = client.from("product_spec_values").delete().eq("product_slug", productSlug);
  if (attributeIds) {
    if (attributeIds.length === 0) return;
    remove = remove.in("attribute_id", attributeIds);
  }
  const { error } = await remove;
  if (error) throw error;
  if (rows.length === 0) return;
  const { error: insertError } = await client
    .from("product_spec_values")
    .insert(rows.map((row) => ({ ...row, product_slug: productSlug })));
  if (insertError) throw insertError;
}
