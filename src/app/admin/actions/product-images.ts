"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { deleteImagesByUrl } from "@/lib/storage";
import { revalidateEntity } from "@/lib/revalidation";
import { IMAGE_TYPES } from "@/lib/bulk-upload/image-files";

/**
 * Bulk product image import. The browser uploads files straight to Supabase Storage
 * with signed upload URLs (no file passes through Vercel), then attaches them here.
 * Images are only ever added to products that already exist.
 */

const BUCKET = "images";
const SLUG = /^[a-z0-9-]{1,120}$/;
const MAX_FILES_PER_PRODUCT = 30;

export type ProductImageInfo = { name: string; imageCount: number };

type Product = { slug: string; name: { th: string; en: string }; images: string[] };

async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await createSupabaseAdminClient()
    .from("products")
    .select("slug, name, images")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
}

/** Which slugs exist? Returns name and current image count, or null if missing. */
export async function checkProductSlugsAction(
  slugs: string[]
): Promise<Record<string, ProductImageInfo | null>> {
  await requireAdmin();

  const valid = [...new Set(slugs)].filter((s) => SLUG.test(s)).slice(0, 2000);
  const result: Record<string, ProductImageInfo | null> = Object.fromEntries(slugs.map((s) => [s, null]));
  if (valid.length === 0) return result;

  const supabase = createSupabaseAdminClient();
  // Chunk the IN() list to keep the URL short
  for (let i = 0; i < valid.length; i += 200) {
    const { data } = await supabase
      .from("products")
      .select("slug, name, images")
      .in("slug", valid.slice(i, i + 200));
    for (const p of (data ?? []) as Product[]) {
      result[p.slug] = { name: p.name.en || p.name.th, imageCount: p.images?.length ?? 0 };
    }
  }
  return result;
}

/** Signed upload URLs for one product's new images (product must exist). */
export async function createProductImageUploadsAction(
  slug: string,
  extensions: string[]
): Promise<{ uploads?: { path: string; token: string }[]; error?: string }> {
  await requireAdmin();

  if (!SLUG.test(slug)) return { error: "Invalid slug" };
  if (extensions.length === 0 || extensions.length > MAX_FILES_PER_PRODUCT) {
    return { error: `Upload 1–${MAX_FILES_PER_PRODUCT} images per product at a time` };
  }
  if (extensions.some((ext) => !IMAGE_TYPES[ext])) return { error: "Unsupported image type" };
  if (!(await getProduct(slug))) return { error: "Product not found — add the product data first" };

  const storage = createSupabaseAdminClient().storage.from(BUCKET);
  const uploads: { path: string; token: string }[] = [];
  for (const ext of extensions) {
    const path = `products/${slug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error || !data) return { error: "Could not prepare the upload. Please try again." };
    uploads.push({ path: data.path, token: data.token });
  }
  return { uploads };
}

/**
 * Attaches uploaded files to the product. "append" adds them after the current images;
 * "replace" makes them the only images and deletes the previous files.
 */
export async function attachProductImagesAction(
  slug: string,
  paths: string[],
  mode: "append" | "replace"
): Promise<{ success: boolean; added?: number; removed?: number; error?: string }> {
  const user = await requireAdmin();

  if (!SLUG.test(slug) || (mode !== "append" && mode !== "replace")) {
    return { success: false, error: "Invalid input" };
  }
  const prefix = `products/${slug}/`;
  if (paths.length === 0 || paths.some((p) => !p.startsWith(prefix) || p.includes(".."))) {
    return { success: false, error: "Invalid file paths" };
  }

  const product = await getProduct(slug);
  if (!product) return { success: false, error: "Product not found" };

  // Only attach files that really exist in storage
  const storage = createSupabaseAdminClient().storage.from(BUCKET);
  const { data: listed } = await storage.list(`products/${slug}`, { limit: 1000 });
  const present = new Set((listed ?? []).map((f) => `${prefix}${f.name}`));
  const missing = paths.filter((p) => !present.has(p));
  if (missing.length > 0) {
    return { success: false, error: `${missing.length} uploaded file(s) not found in storage` };
  }

  const newUrls = paths.map((p) => storage.getPublicUrl(p).data.publicUrl);
  const previous = product.images ?? [];
  const images = mode === "append" ? [...previous, ...newUrls] : newUrls;

  const { error } = await createSupabaseAdminClient()
    .from("products")
    .update({ images })
    .eq("slug", slug);
  if (error) return { success: false, error: "Could not save the product images" };

  const removed = mode === "replace" ? (await deleteImagesByUrl(previous.filter((u) => !images.includes(u)))).deleted : 0;

  revalidateEntity("/admin/products");
  revalidatePath(`/admin/products/${slug}/edit`);
  await logActivity(user, {
    action: "bulk_import",
    entity: "product",
    entityId: slug,
    summary: `${mode === "append" ? "Added" : "Replaced with"} ${newUrls.length} image(s) via bulk upload`,
  });
  return { success: true, added: newUrls.length, removed };
}

/** Cleans up files uploaded for a product whose attach step failed. */
export async function discardUploadedImagesAction(slug: string, paths: string[]): Promise<void> {
  await requireAdmin();

  if (!SLUG.test(slug)) return;
  const storage = createSupabaseAdminClient().storage.from(BUCKET);
  const urls = paths
    .filter((p) => p.startsWith(`products/${slug}/`) && !p.includes(".."))
    .map((p) => storage.getPublicUrl(p).data.publicUrl);
  // deleteImagesByUrl skips anything a product still references
  await deleteImagesByUrl(urls);
}
