import { createSupabaseClient } from "@/lib/supabase";
import type { Category, DbCategory } from "@/data/types";

function toCategory(row: DbCategory): Category {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    parentSlug: row.parent_slug ?? null,
    sortOrder: row.sort_order,
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) return [];
  return (data as DbCategory[]).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return undefined;
  return toCategory(data as DbCategory);
}

export async function getCategorySlugsWithDates(): Promise<
  { slug: string; updatedAt: string }[]
> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, updated_at");
  if (error) return [];
  return data.map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}
