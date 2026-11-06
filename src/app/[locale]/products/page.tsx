import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCategoryBySlug, getBrandBySlug, getPageImage } from "@/lib/db";
import {
  getCachedCategories,
  getCachedBrands,
  getCachedFilteredProducts,
  getCachedProductFacets,
  getCachedSpecsForCategory,
} from "@/lib/db/cached";
import { ProductSpecFilters } from "@/components/products/product-spec-filters";
import { buildFilterGroups, hasSpecFilters, parseSpecFilters } from "@/lib/catalog-filters";
import { redirect } from "@/i18n/navigation";
import { ProductCard } from "@/components/products/product-card";
import { ProductSearch } from "@/components/products/product-search";
import { ProductFilterBar } from "@/components/products/product-filter-bar";
import { ProductPagination } from "@/components/products/product-pagination";
import { FilterNavigationProvider } from "@/components/products/products-filter-context";
import { ViewToggle } from "@/components/products/view-toggle";
import { ProductGridWrapper } from "@/components/products/product-grid-wrapper";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/shared/page-hero";
import {
  getPageUrl,
  getAlternateLanguages,
  getOgLocale,
  getOgAlternateLocale,
  buildBreadcrumbSchema,
} from "@/lib/seo";
import { buildProductsUrl } from "@/lib/url-builders";
import type { Locale } from "@/data/types";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    brand?: string;
    q?: string;
    page?: string;
    view?: string;
    // plus spec filters: f.<spec key>=<value>,<value>
    [filter: string]: string | string[] | undefined;
  }>;
};

// Categories of the old flat structure → where their products moved (taxonomy seed)
const LEGACY_CATEGORIES: Record<string, string> = {
  "flowmeter-regulator": "regulators-gas-control",
  "safety-equipment": "safety-ppe",
  machine: "welding-machines",
  "equipment-consumable": "filler-metals",
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const { category, brand } = sp;
  const category_ = typeof category === "string" ? category : undefined;
  const brand_ = typeof brand === "string" ? brand : undefined;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "products" });

  let title = t("title");
  let description = t("description");
  let pagePath = "/products";

  if (category_) {
    const cat = await getCategoryBySlug(category_);
    if (cat) {
      title = `${cat.name[loc]} — ${t("title")}`;
      description = loc === "th"
        ? `เลือกซื้อ${cat.name.th} — สินค้าอุตสาหกรรมคุณภาพจากแบรนด์ชั้นนำ จัดจำหน่ายโดย แหลมทอง`
        : `Browse ${cat.name.en} — quality industrial products from leading brands, distributed by Laemthong.`;
      pagePath = `/products?category=${category_}`;
    }
  } else if (brand_) {
    const br = await getBrandBySlug(brand_);
    if (br) {
      title = `${br.name} — ${t("title")}`;
      description = br.description[loc] || description;
      pagePath = `/products?brand=${brand_}`;
    }
  }

  const pageUrl = getPageUrl(loc, pagePath);
  return {
    title,
    description,
    // Spec-filtered views are endless combinations of the category page: keep them out of
    // the index (links are still followed); the canonical points to the category page
    ...(hasSpecFilters(sp) ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: pageUrl,
      languages: getAlternateLanguages("/products"),
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      locale: getOgLocale(loc),
      alternateLocale: getOgAlternateLocale(loc),
      type: "website",
    },
    twitter: { title, description },
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const category = str(sp.category);
  const brand = str(sp.brand);
  const q = str(sp.q);
  const pageParam = str(sp.page);
  const viewParam = str(sp.view);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const loc = locale as Locale;

  const MAX_PAGE = 100;
  const pageNum = Math.min(MAX_PAGE, Math.max(1, parseInt(pageParam ?? "1", 10) || 1));
  const view = viewParam === "list" ? "list" : "grid";

  const [categories, brands, heroImage, specs] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getPageImage("hero-products"),
    category ? getCachedSpecsForCategory(category) : Promise.resolve([]),
  ]);

  // Old flat category links → the category their products moved to
  if (category && !categories.some((c) => c.slug === category)) {
    const target = LEGACY_CATEGORIES[category];
    if (target && categories.some((c) => c.slug === target)) {
      redirect({ href: buildProductsUrl({ category: target, brand, q, view: viewParam }), locale });
    }
  }

  const { selection, conditions } = parseSpecFilters(sp, specs);
  const searchFilter = { category, brand, search: q, specFilters: conditions };
  const [result, facets] = await Promise.all([
    getCachedFilteredProducts({ ...searchFilter, locale: loc, page: pageNum, perPage: 24 }),
    category ? getCachedProductFacets({ ...searchFilter, category }) : Promise.resolve([]),
  ]);
  const filterGroups = buildFilterGroups(specs, facets, selection, loc);

  const { products, total, totalPages: rawTotalPages } = result;
  const totalPages = Math.min(MAX_PAGE, rawTotalPages);

  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const activeCategory = category ? categoryMap.get(category) : undefined;
  const activeBrand = brand ? brands.find((b) => b.slug === brand) : undefined;

  const tCommon = await getTranslations({ locale, namespace: "common" });

  // Hero content is always stable — filter context shown via breadcrumb + filter chips
  const heroLabel = t("title");
  const heroTitle = t("title");
  const heroDescription = t("description");

  return (
    <>
      {/* Breadcrumb JSON-LD — always rendered for SEO */}
      <JsonLd
        data={buildBreadcrumbSchema(loc, [
          { name: tCommon("home"), href: "" },
          { name: t("title"), href: "/products" },
          ...(activeCategory
            ? [{ name: activeCategory.name[loc], href: `/products?category=${category}` }]
            : []),
          ...(activeBrand
            ? [{ name: activeBrand.name, href: `/products?brand=${brand}` }]
            : []),
        ])}
      />

      {/* Page header */}
      <PageHero label={heroLabel} title={heroTitle} description={heroDescription} backgroundImage={heroImage ?? undefined} className="pb-10 md:pb-12" />

      <section className="bg-muted/30 pt-8 pb-16 md:pt-10 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <FilterNavigationProvider>
            {/* Full-width search */}
            <Suspense fallback={<div className="h-10 w-full" />}>
              <ProductSearch currentQuery={q ?? ""} />
            </Suspense>

            {/* Tabbed filter bar with view controls */}
            <div className="mt-6 mb-8">
              <ProductFilterBar
                toolbar={
                  <div className="flex items-center gap-3">
                    <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {q
                        ? `${t("searchResultsFor", { query: q })} (${total})`
                        : t("productCount", { count: total })}
                    </p>

                    <ViewToggle
                      currentView={view}
                      gridUrl={buildProductsUrl({ category, brand, q, page: pageNum, view: "grid", filters: selection })}
                      listUrl={buildProductsUrl({ category, brand, q, page: pageNum, view: "list", filters: selection })}
                      gridLabel={t("viewGrid")}
                      listLabel={t("viewList")}
                    />
                  </div>
                }
                categories={categories.map((c) => ({ slug: c.slug, name: c.name[loc], parentSlug: c.parentSlug }))}
                brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
                activeCategory={category}
                activeBrand={brand}
                activeQuery={q}
                viewParam={viewParam}
                filters={selection}
                specFilters={
                  category && (
                    <ProductSpecFilters
                      groups={filterGroups}
                      selection={selection}
                      baseParams={{ category, brand, q, view: viewParam }}
                      labels={{ title: t("filterBySpec"), clear: t("clearSpecFilters") }}
                    />
                  )
                }
                labels={{
                  category: t("filterByCategory"),
                  brand: t("filterByBrand"),
                  allCategories: t("allCategories"),
                  allInCategory: t("allInCategory"),
                  allBrands: t("allBrands"),
                  activeFilters: t("activeFilters"),
                  clearAll: t("clearAll"),
                }}
              />
            </div>

            {/* Product grid/list */}
            <ProductGridWrapper>
              {products.length > 0 ? (
                <>
                  {view === "list" ? (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <ProductCard
                          key={product.slug}
                          product={product}
                          locale={loc}
                          categoryName={categoryMap.get(product.categorySlug)?.name[loc]}
                          variant="list"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {products.map((product, index) => (
                        <ProductCard
                          key={product.slug}
                          product={product}
                          locale={loc}
                          categoryName={categoryMap.get(product.categorySlug)?.name[loc]}
                          priority={index < 4}
                        />
                      ))}
                    </div>
                  )}

                  <ProductPagination
                    currentPage={pageNum}
                    totalPages={totalPages}
                    baseParams={{ category, brand, q, view: viewParam, filters: selection }}
                    previousLabel={t("previousPage")}
                    nextLabel={t("nextPage")}
                  />
                  {rawTotalPages > MAX_PAGE && (
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      {t("useFiltersHint")}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-20 text-center">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    {t("noProductsLabel")}
                  </p>
                  <p className="mt-3 max-w-md text-muted-foreground">
                    {t("noProductsDescription")}
                  </p>
                  {(category || brand || q) && (
                    <div className="mt-6">
                      <ClearFiltersButton label={t("clearAll")} />
                    </div>
                  )}
                </div>
              )}
            </ProductGridWrapper>
          </FilterNavigationProvider>
        </div>
      </section>
    </>
  );
}

function ClearFiltersButton({ label }: { label: string }) {
  // This is rendered inside FilterNavigationProvider, but since it's a server component
  // helper, we need a small client component. However, since the empty state already
  // renders inside the provider, we can use a simple Link with scroll={false}.
  return (
    <Link
      href="/products"
      className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {label}
    </Link>
  );
}
