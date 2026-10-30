"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import {
  adminCreateService,
  adminDeleteService,
  adminUpdateService,
  type ServiceWrite,
} from "@/lib/db/admin";
import { SERVICES_TAG } from "@/lib/db/services";
import { handleActionError } from "@/lib/db/errors";
import { getNextSortOrder } from "@/lib/db/sort-order";
import { revalidateEntity } from "@/lib/revalidation";
import { deleteImageFolder, migrateImagesOnSlugChange } from "@/lib/storage";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";
import type { ActionState } from "./types";

function parse(formData: FormData) {
  return serviceSchema.safeParse({
    slug: formData.get("slug"),
    titleTh: formData.get("titleTh"),
    titleEn: formData.get("titleEn"),
    shortDescriptionTh: formData.get("shortDescriptionTh"),
    shortDescriptionEn: formData.get("shortDescriptionEn"),
    descriptionTh: formData.get("descriptionTh"),
    descriptionEn: formData.get("descriptionEn"),
    metaTitleTh: formData.get("metaTitleTh") ?? undefined,
    metaTitleEn: formData.get("metaTitleEn") ?? undefined,
    metaDescriptionTh: formData.get("metaDescriptionTh") ?? undefined,
    metaDescriptionEn: formData.get("metaDescriptionEn") ?? undefined,
    features: formData.get("features") ?? undefined,
    expertise: formData.get("expertise") ?? undefined,
    processSteps: formData.get("processSteps") ?? undefined,
    isPrimary: formData.get("isPrimary") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });
}

function toRow(v: ServiceInput, imageUrl: string): Omit<ServiceWrite, "sort_order"> {
  return {
    slug: v.slug,
    title: { th: v.titleTh, en: v.titleEn },
    short_description: { th: v.shortDescriptionTh, en: v.shortDescriptionEn },
    description: { th: v.descriptionTh, en: v.descriptionEn },
    // Empty SEO fields fall back to the title / short description
    meta_title: { th: v.metaTitleTh || v.titleTh, en: v.metaTitleEn || v.titleEn },
    meta_description: {
      th: v.metaDescriptionTh || v.shortDescriptionTh,
      en: v.metaDescriptionEn || v.shortDescriptionEn,
    },
    features: v.features,
    expertise: v.expertise,
    process_steps: v.processSteps,
    is_primary: v.isPrimary,
    image_url: imageUrl || null,
  };
}

function refresh() {
  updateTag(SERVICES_TAG);
  revalidateEntity("/admin/services");
}

export async function createServiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();

  const validated = parse(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const v = validated.data;

  // Images uploaded before the slug was final live under a temporary folder
  const tempSlug = formData.get("tempSlug") as string | null;
  let imageUrl = v.imageUrl;
  if (tempSlug && imageUrl) {
    const migrated = await migrateImagesOnSlugChange("services", tempSlug, v.slug, imageUrl);
    if (typeof migrated === "string") imageUrl = migrated;
  }

  try {
    await adminCreateService({
      ...toRow(v, imageUrl),
      sort_order: v.sortOrder ?? (await getNextSortOrder("services")),
    });
  } catch (error) {
    return handleActionError(error, "service", "create");
  }

  refresh();
  await logActivity(user, {
    action: "create",
    entity: "service",
    entityId: v.slug,
    summary: `Created service "${v.titleEn}"`,
  });
  redirect("/admin/services");
}

export async function updateServiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireAdmin();
  const originalSlug = formData.get("originalSlug") as string;

  const validated = parse(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const v = validated.data;

  let imageUrl = v.imageUrl;
  const migrated = await migrateImagesOnSlugChange("services", originalSlug, v.slug, imageUrl);
  if (typeof migrated === "string") imageUrl = migrated;

  try {
    await adminUpdateService(originalSlug, {
      ...toRow(v, imageUrl),
      ...(v.sortOrder !== undefined ? { sort_order: v.sortOrder } : {}),
    });
  } catch (error) {
    return handleActionError(error, "service", "update");
  }

  refresh();
  await logActivity(user, {
    action: "update",
    entity: "service",
    entityId: v.slug,
    summary: `Updated service "${v.titleEn}"`,
  });
  redirect("/admin/services");
}

export async function deleteServiceAction(slug: string): Promise<ActionState> {
  const user = await requireAdmin();

  try {
    await adminDeleteService(slug);
    deleteImageFolder("services", slug).catch(() => {});
  } catch (error) {
    return handleActionError(error, "service", "delete");
  }

  refresh();
  await logActivity(user, {
    action: "delete",
    entity: "service",
    entityId: slug,
    summary: `Deleted service "${slug}"`,
  });
  return { success: true };
}
