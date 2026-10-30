import type { Metadata } from "next";
import { adminGetAllCategories } from "@/lib/db/admin";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { CategoriesTable } from "@/components/admin/categories-table";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  const categories = await adminGetAllCategories();
  const supabase = createSupabaseAdminClient();

  const withCounts = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from("products")
        .select("slug", { count: "exact", head: true })
        .eq("category_slug", category.slug);
      return { ...category, productCount: count ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Product categories ({categories.length}). Drag to change the order used in filters and the
          footer.
        </p>
      </div>

      <CategoriesTable categories={withCounts} />
    </div>
  );
}
