import type { Metadata } from "next";
import { adminGetAllCategories } from "@/lib/db/admin";
import { withCategoryCounts } from "@/lib/db/taxonomy";
import { CategoriesTable } from "@/components/admin/categories-table";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function AdminCategoriesPage() {
  const all = await adminGetAllCategories();
  const mains = await withCategoryCounts(
    all.filter((c) => !c.parent_slug),
    all
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Main categories ({mains.length}) · {all.length - mains.length} sub categories. Open a category to
          manage its sub categories and specs. Drag to change the order used on the website.
        </p>
      </div>

      <CategoriesTable categories={mains} />
    </div>
  );
}
