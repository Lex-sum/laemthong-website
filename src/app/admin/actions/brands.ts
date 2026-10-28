"use server";

import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { brandSchema } from "@/lib/validations/brand";
import {
  adminCreateBrand,
  adminUpdateBrand,
  adminDeleteBrand,
} from "@/lib/db/admin";
import { deleteImageFolder, migrateImagesOnSlugChange } from "@/lib/storage";
import { handleActionError } from "@/lib/db/errors";
import { getNextSortOrder } from "@/lib/db/sort-order";
import { revalidateEntity } from "@/lib/revalidation";
import type { BrandActionState } from "./types";


export async function createBrandAction(
  _prevState: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  await requireAdmin();

  const validated = brandSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    logo: formData.get("logo") || undefined,
    descriptionTh: formData.get("descriptionTh"),
    descriptionEn: formData.get("descriptionEn"),
    website: formData.get("website") || "",
    country: formData.get("country"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const skipRedirect = formData.get("_skipRedirect") === "true";

  const sortOrder = validated.data.sortOrder ?? await getNextSortOrder("brands");

  let newBrand: import("@/data/types").DbBrand;

  try {
    newBrand = await adminCreateBrand({
      slug: validated.data.slug,
      name: validated.data.name,
      logo: validated.data.logo || "",
      description: {
        th: validated.data.descriptionTh,
        en: validated.data.descriptionEn,
      },
      website: validated.data.website || null,
      country: validated.data.country,
      sort_order: sortOrder,
    });
  } catch (error) {
    return handleActionError(error, "brand", "create");
  }

  revalidateEntity("/admin/brands");

  if (skipRedirect) {
    return { success: true, brand: newBrand };
  }

  redirect("/admin/brands");
}

export async function updateBrandAction(
  _prevState: BrandActionState,
  formData: FormData
): Promise<BrandActionState> {
  await requireAdmin();

  const originalSlug = formData.get("originalSlug") as string;

  const validated = brandSchema.safeParse({
    slug: formData.get("slug"),
    name: formData.get("name"),
    logo: formData.get("logo") || undefined,
    descriptionTh: formData.get("descriptionTh"),
    descriptionEn: formData.get("descriptionEn"),
    website: formData.get("website") || "",
    country: formData.get("country"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const slug = validated.data.slug;

  // Handle logo migration if slug changed
  let logo = validated.data.logo || "";
  const migrated = await migrateImagesOnSlugChange("brands", originalSlug, slug, logo);
  if (typeof migrated === "string") {
    logo = migrated;
  }

  // Build update object
  const updateData: Parameters<typeof adminUpdateBrand>[1] = {
    slug: slug,
    name: validated.data.name,
    logo: logo,
    description: {
      th: validated.data.descriptionTh,
      en: validated.data.descriptionEn,
    },
    website: validated.data.website || null,
    country: validated.data.country,
  };

  if (validated.data.sortOrder !== undefined) {
    updateData.sort_order = validated.data.sortOrder;
  }

  try {
    await adminUpdateBrand(originalSlug, updateData);
  } catch (error) {
    return handleActionError(error, "brand", "update");
  }

  revalidateEntity("/admin/brands");
  redirect("/admin/brands");
}

export async function deleteBrandAction(slug: string): Promise<BrandActionState> {
  await requireAdmin();

  try {
    await adminDeleteBrand(slug);
    deleteImageFolder("brands", slug).catch(() => {});
  } catch (error) {
    return handleActionError(error, "brand", "delete");
  }

  revalidateEntity("/admin/brands");
  return { success: true };
}
