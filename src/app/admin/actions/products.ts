"use server";

import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { productSchema } from "@/lib/validations/product";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/db/admin";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { deleteImageFolder, moveImageFolder, migrateImagesOnSlugChange } from "@/lib/storage";
import { handleActionError } from "@/lib/db/errors";
import { getNextSortOrder } from "@/lib/db/sort-order";
import { revalidateEntity } from "@/lib/revalidation";
import { slugify } from "@/lib/utils";
import type { LocalizedString } from "@/data/types";
import type { ActionState } from "./types";

function parseJsonOrDefault<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const validated = productSchema.safeParse({
    slug: formData.get("slug") || undefined,
    nameTh: formData.get("nameTh"),
    nameEn: formData.get("nameEn"),
    shortDescriptionTh: formData.get("shortDescriptionTh"),
    shortDescriptionEn: formData.get("shortDescriptionEn"),
    descriptionTh: formData.get("descriptionTh"),
    descriptionEn: formData.get("descriptionEn"),
    categorySlug: formData.get("categorySlug"),
    brandSlug: formData.get("brandSlug"),
    images: formData.get("images") || undefined,
    specifications: formData.get("specifications") || undefined,
    features: formData.get("features") || undefined,
    documents: formData.get("documents") || undefined,
    featured: formData.get("featured") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // Auto-generate slug from English name if not provided
  const slug = validated.data.slug || slugify(validated.data.nameEn);

  const sortOrder = validated.data.sortOrder ?? await getNextSortOrder("products");

  // Handle image migration from temporary slug to final slug
  let images = parseJsonOrDefault<string[]>(validated.data.images, []);
  if (images.length > 0 && images[0].includes('/products/temp-')) {
    const tempSlugMatch = images[0].match(/\/products\/(temp-\d+)\//);
    if (tempSlugMatch) {
      const tempSlug = tempSlugMatch[1];
      try {
        const newUrls = await moveImageFolder("products", tempSlug, slug);
        if (newUrls.length > 0) {
          images = newUrls;
        }
      } catch {
        return {
          errors: {
            images: ["Failed to finalize uploaded images. Please try again or re-upload."],
          },
        };
      }
    }
  }

  try {
    await adminCreateProduct({
      slug,
      category_slug: validated.data.categorySlug,
      brand_slug: validated.data.brandSlug,
      name: { th: validated.data.nameTh, en: validated.data.nameEn },
      short_description: {
        th: validated.data.shortDescriptionTh,
        en: validated.data.shortDescriptionEn,
      },
      description: {
        th: validated.data.descriptionTh,
        en: validated.data.descriptionEn,
      },
      images,
      specifications: parseJsonOrDefault<
        { label: LocalizedString; value: LocalizedString }[]
      >(validated.data.specifications, []),
      features: parseJsonOrDefault<LocalizedString[]>(
        validated.data.features,
        []
      ),
      documents: parseJsonOrDefault<{ name: string; url: string }[]>(
        validated.data.documents,
        []
      ),
      featured: validated.data.featured === "on",
      sort_order: sortOrder,
    });
  } catch (error) {
    return handleActionError(error, "product", "create");
  }

  revalidateEntity("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const originalSlug = formData.get("originalSlug") as string;

  const validated = productSchema.safeParse({
    slug: formData.get("slug") || undefined,
    nameTh: formData.get("nameTh"),
    nameEn: formData.get("nameEn"),
    shortDescriptionTh: formData.get("shortDescriptionTh"),
    shortDescriptionEn: formData.get("shortDescriptionEn"),
    descriptionTh: formData.get("descriptionTh"),
    descriptionEn: formData.get("descriptionEn"),
    categorySlug: formData.get("categorySlug"),
    brandSlug: formData.get("brandSlug"),
    images: formData.get("images") || undefined,
    specifications: formData.get("specifications") || undefined,
    features: formData.get("features") || undefined,
    documents: formData.get("documents") || undefined,
    featured: formData.get("featured") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const slug = validated.data.slug || originalSlug;

  // Handle image migration if slug changed
  let images = parseJsonOrDefault<string[]>(validated.data.images, []);
  const migrated = await migrateImagesOnSlugChange("products", originalSlug, slug, images);
  if (Array.isArray(migrated)) {
    images = migrated;
  }

  // Build update object
  const updateData: Parameters<typeof adminUpdateProduct>[1] = {
    slug,
    category_slug: validated.data.categorySlug,
    brand_slug: validated.data.brandSlug,
    name: { th: validated.data.nameTh, en: validated.data.nameEn },
    short_description: {
      th: validated.data.shortDescriptionTh,
      en: validated.data.shortDescriptionEn,
    },
    description: {
      th: validated.data.descriptionTh,
      en: validated.data.descriptionEn,
    },
    images,
    specifications: parseJsonOrDefault<
      { label: LocalizedString; value: LocalizedString }[]
    >(validated.data.specifications, []),
    features: parseJsonOrDefault<LocalizedString[]>(
      validated.data.features,
      []
    ),
    documents: parseJsonOrDefault<{ name: string; url: string }[]>(
      validated.data.documents,
      []
    ),
    featured: validated.data.featured === "on",
  };

  if (validated.data.sortOrder !== undefined) {
    updateData.sort_order = validated.data.sortOrder;
  }

  try {
    await adminUpdateProduct(originalSlug, updateData);
  } catch (error) {
    return handleActionError(error, "product", "update");
  }

  revalidateEntity("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(
  slug: string
): Promise<ActionState> {
  await requireAdmin();

  try {
    await adminDeleteProduct(slug);
    deleteImageFolder("products", slug).catch(() => {});
  } catch (error) {
    return handleActionError(error, "product", "delete");
  }

  revalidateEntity("/admin/products");
  return { success: true };
}

export async function bulkDeleteProductsAction(
  slugs: string[]
): Promise<{ success: boolean; deleted: number; message?: string }> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").delete().in("slug", slugs);

  if (error) {
    return { success: false, deleted: 0, message: error.message };
  }

  // Parallel image cleanup (fire-and-forget)
  Promise.allSettled(
    slugs.map((slug) => deleteImageFolder("products", slug))
  );

  revalidateEntity("/admin/products");
  return { success: true, deleted: slugs.length };
}
