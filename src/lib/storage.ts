import { createSupabaseAdminClient } from "@/lib/supabase";

const BUCKET = "images";

export type ImageFolder = "products" | "brands" | "categories" | "pages" | "services";

/**
 * Upload a single image file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(
  folder: ImageFolder,
  entitySlug: string,
  file: File
): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${folder}/${entitySlug}/${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a single image from storage by its public URL.
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const path = extractPathFromUrl(publicUrl);
  if (!path) return;

  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * Delete all images in a folder (e.g., when deleting a product).
 */
export async function deleteImageFolder(
  folder: ImageFolder,
  entitySlug: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const prefix = `${folder}/${entitySlug}`;

  const { data: files, error: listError} = await supabase.storage
    .from(BUCKET)
    .list(prefix);

  if (listError || !files || files.length === 0) return;

  const paths = files.map((f) => `${prefix}/${f.name}`);
  await supabase.storage.from(BUCKET).remove(paths);
}

/** True if the URL points at a file in our public `images` bucket. */
export function isOwnImageUrl(url: string): boolean {
  return extractPathFromUrl(url) !== null;
}

/** Is this public URL still used by any product, brand, service or page image? */
async function isImageReferenced(url: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const checks = await Promise.all([
    // products.images is jsonb — .contains() would send a Postgres array literal, so pass JSON
    supabase.from("products").select("slug", { count: "exact", head: true }).filter("images", "cs", JSON.stringify([url])),
    supabase.from("brands").select("slug", { count: "exact", head: true }).eq("logo", url),
    supabase.from("services").select("slug", { count: "exact", head: true }).eq("image_url", url),
    supabase.from("page_images").select("key", { count: "exact", head: true }).eq("image_url", url),
  ]);
  // If a check fails we can't prove the file is unused — keep it.
  return checks.some((c) => c.error || (c.count ?? 0) > 0);
}

/**
 * Delete image files by their public URLs — but only files no record uses anymore.
 * Call AFTER the database change, so the record being edited/deleted no longer
 * references them. Image identity is the URL, never the folder name.
 */
export async function deleteImagesByUrl(
  urls: (string | null | undefined)[]
): Promise<{ deleted: number; kept: number }> {
  const unique = [...new Set(urls.filter((u): u is string => !!u && isOwnImageUrl(u)))];
  const toDelete: string[] = [];
  let kept = 0;

  for (const url of unique) {
    if (await isImageReferenced(url)) kept++;
    else toDelete.push(extractPathFromUrl(url)!);
  }

  if (toDelete.length > 0) {
    const { error } = await createSupabaseAdminClient().storage.from(BUCKET).remove(toDelete);
    if (error) {
      console.error("Failed to delete image files:", error);
      return { deleted: 0, kept: kept + toDelete.length };
    }
  }
  return { deleted: toDelete.length, kept };
}

function extractPathFromUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
