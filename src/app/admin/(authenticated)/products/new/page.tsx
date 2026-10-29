import type { Metadata } from "next";
import {
  adminGetAllBrands,
  adminGetAllCategories,
  adminGetSapInfoForSlug,
} from "@/lib/db/admin";
import { ProductForm, type ProductFormDefaults } from "@/components/admin/product-form";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes-provider";

export const metadata: Metadata = {
  title: "New Product",
};

type Props = {
  searchParams: Promise<{ sapCode?: string | string[] }>;
};

export default async function NewProductPage({ searchParams }: Props) {
  const { sapCode } = await searchParams;
  const [brands, categories, sapInfo] = await Promise.all([
    adminGetAllBrands(),
    adminGetAllCategories(),
    typeof sapCode === "string" && sapCode ? adminGetSapInfoForSlug(sapCode) : undefined,
  ]);

  // Started from "Products in SAP B1" → Add: pre-fill slug and short description
  const sapItem = sapInfo?.match;
  const defaults: ProductFormDefaults | undefined = sapItem
    ? { slug: sapItem.item_code, shortDescription: sapItem.item_name }
    : undefined;

  return (
    <UnsavedChangesProvider>
      <div className="space-y-6">
        <div>
          <AdminBreadcrumb
            items={[
              { label: "Products", href: "/admin/products" },
              { label: "New Product" },
            ]}
          />
          <div className="mt-2">
            <AdminPageTitle
              title="New Product"
              description="Add a new product to the catalog."
            />
          </div>
        </div>

        <div className="max-w-4xl rounded-xl border bg-card p-6">
          <ProductForm
            brands={brands}
            categories={categories}
            defaults={defaults}
            sapInfo={sapInfo}
          />
        </div>
      </div>
    </UnsavedChangesProvider>
  );
}
