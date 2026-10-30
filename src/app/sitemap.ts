import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getProductSlugsWithDates,
  getCategorySlugsWithDates,
  getBrandSlugsWithDates,
} from "@/lib/db";
import { getAllServices } from "@/lib/db/services";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://laemthong-website.vercel.app";
  const locales = routing.locales;

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/services", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/brands", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  const [productData, categoryData, brandData, services] = await Promise.all([
    getProductSlugsWithDates(),
    getCategorySlugsWithDates(),
    getBrandSlugsWithDates(),
    getAllServices(),
  ]);

  const urls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      urls.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    for (const { slug, updatedAt } of productData) {
      urls.push({
        url: `${baseUrl}/${locale}/products/${slug}`,
        lastModified: new Date(updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const { slug, updatedAt } of categoryData) {
      urls.push({
        url: `${baseUrl}/${locale}/products?category=${slug}`,
        lastModified: new Date(updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const { slug, updatedAt } of brandData) {
      urls.push({
        url: `${baseUrl}/${locale}/products?brand=${slug}`,
        lastModified: new Date(updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const { slug, updatedAt } of services) {
      urls.push({
        url: `${baseUrl}/${locale}/services/${slug}`,
        lastModified: updatedAt ? new Date(updatedAt) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return urls;
}
