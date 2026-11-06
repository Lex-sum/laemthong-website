import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetAllCategories } from "@/lib/db/admin";
import { adminGetCategorySpecs, adminGetSpecUsage, withCategoryCounts } from "@/lib/db/taxonomy";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { CategoriesTable } from "@/components/admin/categories-table";
import { SpecsManager } from "@/components/admin/taxonomy/specs-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Category ${slug}` };
}

export default async function AdminCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const all = await adminGetAllCategories();
  const category = all.find((c) => c.slug === slug);
  if (!category) notFound();

  const parent = category.parent_slug ? all.find((c) => c.slug === category.parent_slug) : undefined;
  const isMain = !category.parent_slug;
  const [{ own, inherited }, subs] = await Promise.all([
    adminGetCategorySpecs(category),
    isMain ? withCategoryCounts(all.filter((c) => c.parent_slug === slug), all) : Promise.resolve([]),
  ]);
  const usage = await adminGetSpecUsage([...own, ...inherited].map((s) => s.id));
  const name = category.name.en || category.name.th;
  const defaultTab = isMain && tab !== "specs" ? "subs" : "specs";

  return (
    <div className="space-y-6">
      <div>
        <AdminBreadcrumb
          items={[
            { label: "Categories", href: "/admin/categories" },
            ...(parent ? [{ label: parent.name.en || parent.name.th, href: `/admin/categories/${parent.slug}` }] : []),
            { label: name },
          ]}
        />
        <h1 className="mt-2 text-2xl font-bold text-foreground">{category.name.th}</h1>
        <p className="text-sm text-muted-foreground">
          {category.name.en} · <span className="font-mono">{category.slug}</span> ·{" "}
          {isMain ? "Main category" : "Sub category"}
          {parent && (
            <>
              {" "}of{" "}
              <Link href={`/admin/categories/${parent.slug}`} className="text-primary hover:underline">
                {parent.name.th}
              </Link>
            </>
          )}
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {isMain && <TabsTrigger value="subs">Sub categories ({subs.length})</TabsTrigger>}
          <TabsTrigger value="specs">Specs ({own.length + inherited.length})</TabsTrigger>
        </TabsList>
        {isMain && (
          <TabsContent value="subs" className="pt-4">
            <CategoriesTable categories={subs} parentSlug={slug} />
          </TabsContent>
        )}
        <TabsContent value="specs" className="pt-4">
          <SpecsManager
            categorySlug={slug}
            own={own}
            inherited={inherited}
            parent={parent ? { slug: parent.slug, name: parent.name.th } : undefined}
            usage={usage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
