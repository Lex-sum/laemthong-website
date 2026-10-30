"use server";

import { requireAdmin } from "@/lib/auth";
import { logActivity, type ActivityEntity } from "@/lib/activity";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { revalidateEntity } from "@/lib/revalidation";

const ENTITY: Record<ReorderTable, ActivityEntity> = {
  brands: "brand",
  categories: "category",
  products: "product",
  services: "service",
};

type ReorderTable = "brands" | "categories" | "products" | "services";

async function reorderEntities(table: ReorderTable, slugs: string[], adminPath: string) {
  const user = await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const sortOrders = slugs.map((_, i) => (i + 1) * 10);

  const { error } = await supabase.rpc("batch_reorder", {
    p_table: table,
    p_slugs: slugs,
    p_sort_orders: sortOrders,
  });

  if (error) throw error;
  revalidateEntity(adminPath);
  await logActivity(user, {
    action: "reorder",
    entity: ENTITY[table],
    summary: `Reordered ${slugs.length} ${table}`,
  });
}

export async function reorderBrands(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("brands", slugs, "/admin/brands");
}

export async function reorderCategories(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("categories", slugs, "/admin/categories");
}

export async function reorderProducts(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("products", slugs, "/admin/products");
}

export async function reorderServices(slugs: string[]) {
  await requireAdmin();

  return reorderEntities("services", slugs, "/admin/services");
}
