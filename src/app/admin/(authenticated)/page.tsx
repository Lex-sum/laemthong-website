import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Building2, Tags, MessageSquare, Plus, Upload, ImageIcon } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getCounts() {
  const supabase = createSupabaseClient();
  const [products, brands, categories, inquiries] = await Promise.all([
    supabase.from("products").select("slug", { count: "exact", head: true }),
    supabase.from("brands").select("slug", { count: "exact", head: true }),
    supabase.from("categories").select("slug", { count: "exact", head: true }),
    supabase.from("contact_inquiries").select("id", { count: "exact", head: true }),
  ]);
  return {
    products: products.count ?? 0,
    brands: brands.count ?? 0,
    categories: categories.count ?? 0,
    inquiries: inquiries.count ?? 0,
  };
}

const quickActions = [
  { label: "Add Product", href: "/admin/products/new", icon: Plus },
  { label: "Add Brand", href: "/admin/brands/new", icon: Plus },
  { label: "Bulk Upload", href: "/admin/bulk-upload", icon: Upload },
  { label: "Page Images", href: "/admin/page-images", icon: ImageIcon },
];

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const cards = [
    {
      title: "Products",
      count: counts.products,
      icon: Package,
      href: "/admin/products",
    },
    {
      title: "Brands",
      count: counts.brands,
      icon: Building2,
      href: "/admin/brands",
    },
    {
      title: "Categories",
      count: counts.categories,
      icon: Tags,
      href: "/admin/categories",
    },
    {
      title: "Inquiries",
      count: counts.inquiries,
      icon: MessageSquare,
      href: "/admin/inquiries",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your product catalog.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.count}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
