"use server";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { revalidateEntity } from "@/lib/revalidation";

async function reorderEntities(
  table: "brands" | "categories" | "products",
  slugs: string[],
  adminPath: string
) {
  const supabase = createSupabaseAdminClient();
  const sortOrders = slugs.map((_, i) => (i + 1) * 10);

  const { error } = await supabase.rpc("batch_reorder", {
    p_table: table,
    p_slugs: slugs,
    p_sort_orders: sortOrders,
  });

  if (error) throw error;
  revalidateEntity(adminPath);
}

export async function reorderBrands(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("brands", slugs, "/admin/brands");
}

export async function reorderCategories(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("categories", slugs, "/admin/products");
}

export async function reorderProducts(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("products", slugs, "/admin/products");
}
