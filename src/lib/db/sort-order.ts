import { createSupabaseAdminClient } from "@/lib/supabase";

/**
 * Get the next sort order value for a table.
 * Returns (max_sort_order + 10) or 10 if no rows exist.
 */
export async function getNextSortOrder(
  table: "brands" | "categories" | "products" | "services"
): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  return (data?.sort_order ?? -10) + 10;
}
