"use server";

import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { categorySchema } from "@/lib/validations/category";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetCategoryBySlug,
} from "@/lib/db/admin";
import { createSupabaseAdminClient } from "@/lib/supabase";
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

  // Sub categories hang off a main category (two levels only)
  const parentSlug = (formData.get("parentSlug") as string | null) || null;
  if (parentSlug) {
    const parent = await adminGetCategoryBySlug(parentSlug);
    if (!parent || parent.parent_slug) {
      return { message: "Sub categories can only be added to a main category." };
    }
  }

  const sortOrder = validated.data.sortOrder ?? await getNextSortOrder("categories");

  let newCategory: import("@/data/types").DbCategory;

  try {
    newCategory = await adminCreateCategory({
      slug: validated.data.slug,
      name: { th: validated.data.nameTh, en: validated.data.nameEn },
      description: { th: "", en: "" },
      sort_order: sortOrder,
      parent_slug: parentSlug,
    });
  } catch (error) {
    return handleActionError(error, "category", "create");
  }

  revalidateEntity("/admin/categories");
  await logActivity(user, { action: "create", entity: "category", entityId: validated.data.slug, summary: `Created ${parentSlug ? `sub category of ${parentSlug}` : "category"} "${validated.data.nameEn}"` });

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

  revalidateEntity("/admin/categories");
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

  // Say exactly what blocks the delete (the database would refuse either way)
  const supabase = createSupabaseAdminClient();
  const [{ count: subs }, { count: products }] = await Promise.all([
    supabase.from("categories").select("slug", { count: "exact", head: true }).eq("parent_slug", slug),
    supabase.from("products").select("slug", { count: "exact", head: true }).eq("category_slug", slug),
  ]);
  if (subs) return { message: `Delete or move its ${subs} sub categories first.` };
  if (products) return { message: `${products} products use this category — move them to another category first.` };

  try {
    await adminDeleteCategory(slug);
    deleteImageFolder("categories", slug).catch(() => {});
  } catch (error) {
    return handleActionError(error, "category", "delete");
  }

  revalidateEntity("/admin/categories");
  await logActivity(user, { action: "delete", entity: "category", entityId: slug, summary: `Deleted category "${slug}"` });
  return { success: true };
}
