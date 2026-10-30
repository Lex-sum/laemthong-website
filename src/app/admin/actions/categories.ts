"use server";

import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { categorySchema } from "@/lib/validations/category";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "@/lib/db/admin";
import { deleteImageFolder } from "@/lib/storage";
import { handleActionError } from "@/lib/db/errors";
import { getNextSortOrder } from "@/lib/db/sort-order";
import { revalidateEntity } from "@/lib/revalidation";
import type { CategoryActionState } from "./types";


export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const user = await requireAdmin();

  const validated = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameTh: formData.get("nameTh"),
    nameEn: formData.get("nameEn"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const skipRedirect = formData.get("_skipRedirect") === "true";

  const sortOrder = validated.data.sortOrder ?? await getNextSortOrder("categories");

  let newCategory: import("@/data/types").DbCategory;

  try {
    newCategory = await adminCreateCategory({
      slug: validated.data.slug,
      name: { th: validated.data.nameTh, en: validated.data.nameEn },
      description: { th: "", en: "" },
      sort_order: sortOrder,
    });
  } catch (error) {
    return handleActionError(error, "category", "create");
  }

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "create", entity: "category", entityId: validated.data.slug, summary: `Created category "${validated.data.nameEn}"` });

  if (skipRedirect) {
    return { success: true, category: newCategory };
  }

  redirect("/admin/products");
}

export async function updateCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const user = await requireAdmin();

  const originalSlug = formData.get("originalSlug") as string;
  const skipRedirect = formData.get("_skipRedirect") === "true";

  const validated = categorySchema.safeParse({
    slug: formData.get("slug"),
    nameTh: formData.get("nameTh"),
    nameEn: formData.get("nameEn"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const slug = validated.data.slug;

  const updateData: Parameters<typeof adminUpdateCategory>[1] = {
    slug: slug,
    name: { th: validated.data.nameTh, en: validated.data.nameEn },
    description: { th: "", en: "" },
  };

  if (validated.data.sortOrder !== undefined) {
    updateData.sort_order = validated.data.sortOrder;
  }

  try {
    await adminUpdateCategory(originalSlug, updateData);
  } catch (error) {
    return handleActionError(error, "category", "update");
  }

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "update", entity: "category", entityId: slug, summary: `Updated category "${validated.data.nameEn}"` });

  if (skipRedirect) {
    return { success: true };
  }

  redirect("/admin/products");
}

export async function deleteCategoryAction(
  slug: string
): Promise<CategoryActionState> {
  const user = await requireAdmin();

  try {
    await adminDeleteCategory(slug);
    deleteImageFolder("categories", slug).catch(() => {});
  } catch (error) {
    return handleActionError(error, "category", "delete");
  }

  revalidateEntity("/admin/products");
  await logActivity(user, { action: "delete", entity: "category", entityId: slug, summary: `Deleted category "${slug}"` });
  return { success: true };
}
