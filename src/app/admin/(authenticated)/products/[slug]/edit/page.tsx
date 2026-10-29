import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  adminGetProductBySlug,
  adminGetAllBrands,
  adminGetAllCategories,
  adminGetSapInfoForSlug,
} from "@/lib/db/admin";
import { ProductForm } from "@/components/admin/product-form";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes-provider";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit ${slug}` };
}

export default async function EditProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, brands, categories, sapInfo] = await Promise.all([
    adminGetProductBySlug(slug),
    adminGetAllBrands(),
    adminGetAllCategories(),
    adminGetSapInfoForSlug(slug),
  ]);

  if (!product) notFound();

  return (
    <UnsavedChangesProvider>
      <div className="space-y-6">
        <div>
          <AdminBreadcrumb
            items={[
              { label: "Products", href: "/admin/products" },
              { label: `Edit "${product.name.en}"` },
            ]}
          />
          <div className="mt-2">
            <AdminPageTitle
              title={`Edit ${product.name.en}`}
              description="Update product details."
            />
          </div>
        </div>

        <div className="max-w-4xl rounded-xl border bg-card p-6">
          <ProductForm
            product={product}
            brands={brands}
            categories={categories}
            sapInfo={sapInfo}
          />
        </div>
      </div>
    </UnsavedChangesProvider>
  );
}
