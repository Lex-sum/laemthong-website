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

/**
 * Move all images from one entity folder to another (e.g., temp slug to final slug).
 * Returns array of new public URLs in the same order as the original URLs.
 */
export async function moveImageFolder(
  folder: ImageFolder,
  fromEntitySlug: string,
  toEntitySlug: string
): Promise<string[]> {
  const supabase = createSupabaseAdminClient();
  const fromPrefix = `${folder}/${fromEntitySlug}`;
  const toPrefix = `${folder}/${toEntitySlug}`;

  // List all files in the source folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(fromPrefix);

  if (listError || !files || files.length === 0) {
    return [];
  }

  const newUrls: string[] = [];

  // Move each file to the new folder
  for (const file of files) {
    const fromPath = `${fromPrefix}/${file.name}`;
    const toPath = `${toPrefix}/${file.name}`;

    // Copy file to new location
    const { error: moveError } = await supabase.storage
      .from(BUCKET)
      .move(fromPath, toPath);

    if (!moveError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(toPath);
      newUrls.push(publicUrl);
    }
  }

  return newUrls;
}

/**
 * When an entity's slug changes, migrate its images to the new folder path.
 * Returns the updated image URL(s) or null if no migration was needed.
 */
export async function migrateImagesOnSlugChange(
  folder: ImageFolder,
  oldSlug: string,
  newSlug: string,
  currentImages: string | string[]
): Promise<string | string[] | null> {
  if (oldSlug === newSlug) return null;

  const imageList = Array.isArray(currentImages)
    ? currentImages
    : [currentImages];
  if (imageList.length === 0 || !imageList[0]) return null;

  try {
    const newUrls = await moveImageFolder(folder, oldSlug, newSlug);
    if (newUrls.length > 0) {
      return Array.isArray(currentImages) ? newUrls : newUrls[0];
    }
  } catch (error) {
    console.error(`Failed to migrate ${folder} images on slug change:`, error);
    // Continue with old URLs - images still accessible under old slug
  }

  return null;
}

function extractPathFromUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
