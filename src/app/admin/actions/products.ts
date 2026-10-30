"use server";

import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { productSchema } from "@/lib/validations/product";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetProductBySlug,
} from "@/lib/db/admin";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { deleteImagesByUrl } from "@/lib/storage";
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
  const user = await requireAdmin();

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

  // Images uploaded before saving stay where they are — the URL is the image's identity
  const images = parseJsonOrDefault<string[]>(validated.data.images, []);

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
  await logActivity(user, { action: "create", entity: "product", entityId: slug, summary: `Created product "${validated.data.nameEn}"` });
  redirect("/admin/products");
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();

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

  // The product slug is fixed after creation: it is the SAP item code, the page URL
  // and the image folder name. Reject any attempt to change it.
  const slug = originalSlug;
  if (validated.data.slug && validated.data.slug !== originalSlug) {
    return {
      errors: { slug: ["The slug can't be changed after the product is created."] },
    };
  }

  const existing = await adminGetProductBySlug(originalSlug);
  if (!existing) {
    return { message: "Product not found. It may have been deleted." };
  }
  const images = parseJsonOrDefault<string[]>(validated.data.images, []);

  // Build update object
  const updateData: Parameters<typeof adminUpdateProduct>[1] = {
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

  // Delete files of images removed in the form — only now that the change is saved
  await deleteImagesByUrl(existing.images.filter((url) => !images.includes(url)));

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "update", entity: "product", entityId: slug, summary: `Updated product "${validated.data.nameEn}"` });
  redirect("/admin/products");
}

export async function deleteProductAction(
  slug: string
): Promise<ActionState> {
  const user = await requireAdmin();

  const existing = await adminGetProductBySlug(slug);
  try {
    await adminDeleteProduct(slug);
  } catch (error) {
    return handleActionError(error, "product", "delete");
  }
  // Remove exactly the files this product used (files another record uses are kept)
  await deleteImagesByUrl(existing?.images ?? []);

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "delete", entity: "product", entityId: slug, summary: `Deleted product "${slug}"` });
  return { success: true };
}

export async function bulkDeleteProductsAction(
  slugs: string[]
): Promise<{ success: boolean; deleted: number; message?: string }> {
  const user = await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { data: deletedRows, error } = await supabase
    .from("products")
    .delete()
    .in("slug", slugs)
    .select("images");

  if (error) {
    return { success: false, deleted: 0, message: error.message };
  }

  // Remove exactly the files the deleted products used
  await deleteImagesByUrl((deletedRows ?? []).flatMap((row) => (row.images as string[]) ?? []));

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "bulk_delete", entity: "product", summary: `Deleted ${slugs.length} products: ${slugs.slice(0, 20).join(", ")}${slugs.length > 20 ? ", …" : ""}` });
  return { success: true, deleted: slugs.length };
}
