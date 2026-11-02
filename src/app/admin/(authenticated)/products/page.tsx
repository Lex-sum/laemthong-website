import type { Metadata } from "next";
import Link from "next/link";
import {
  adminGetProducts,
  adminGetAllBrands,
  adminGetAllCategories,
  adminCountProductsOverImageLimit,
  type AdminProductsQuery,
} from "@/lib/db/admin";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Upload } from "lucide-react";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata: Metadata = {
  title: "Products",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const ALLOWED_PAGE_SIZES = [20, 50, 100];
  const rawPageSize = params.pageSize ? Number(params.pageSize) : 20;
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize) ? rawPageSize : 20;

  const query: AdminProductsQuery = {
    page: params.page ? Number(params.page) : 1,
    pageSize,
    search: typeof params.search === "string" ? params.search : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    brand: typeof params.brand === "string" ? params.brand : undefined,
    overImageLimit: params.overImageLimit === "1",
    sap: params.sap === "in" || params.sap === "out" ? params.sap : undefined,
    missingEnglish: params.lang === "th-only",
  };

  const [result, brands, categories, overLimitCount] = await Promise.all([
    adminGetProducts(query),
    adminGetAllBrands(),
    adminGetAllCategories(),
    adminCountProductsOverImageLimit(),
  ]);

  const brandEntries: [string, string][] = brands.map((b) => [b.slug, b.name]);
  const categoryEntries: [string, string][] = categories.map((c) => [
    c.slug,
    c.name.en,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage product catalog ({result.total.toLocaleString()})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/bulk-upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Shown when the image limit was lowered below what some products already have */}
      {(overLimitCount > 0 || query.overImageLimit) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {overLimitCount} product{overLimitCount === 1 ? " has" : "s have"} more than {MAX_PRODUCT_IMAGES} images
            (the current limit). Their images still show on the website, but new images can&apos;t be
            added until some are removed.
          </span>
          {query.overImageLimit ? (
            <Link href="/admin/products" className="font-medium underline underline-offset-2">
              Show all products
            </Link>
          ) : (
            <Link href="/admin/products?overImageLimit=1" className="font-medium underline underline-offset-2">
              Show them
            </Link>
          )}
        </div>
      )}

      {result.sapFilterUnavailable && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          The In SAP / Not in SAP filter needs a database update: run{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">supabase/migrations/20261102000000_admin_products_sap_view.sql</code>{" "}
          in the Supabase SQL Editor.
        </div>
      )}

      <ProductsTable
        products={result.products}
        sapSlugs={result.sapSlugs}
        brandEntries={brandEntries}
        categoryEntries={categoryEntries}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
      />
    </div>
  );
}
