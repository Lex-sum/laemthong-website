"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { adminGetAllCategories } from "@/lib/db/admin";
import {
  adminDeleteSpecAttribute,
  adminGetAllSpecs,
  adminGetSpecUsage,
  adminReorderSpecAttributes,
  adminSaveSpecAttribute,
} from "@/lib/db/taxonomy";
import { revalidateEntity } from "@/lib/revalidation";
import type { ActionState } from "./types";

const KEY = /^[a-z0-9-]+$/;
const keySchema = z.string().trim().min(1, "Key is required").max(60).regex(KEY, "Use lowercase letters, numbers and dashes");
const localized = (label: string, required: boolean) =>
  z.object({
    th: required ? z.string().trim().min(1, `${label} (TH) is required`) : z.string().trim(),
    en: z.string().trim(),
  });

const bucketSchema = z
  .object({ min: z.number().finite().nullable(), max: z.number().finite().nullable() })
  .refine((b) => b.min !== null || b.max !== null, "A range needs a min or a max")
  .refine((b) => b.min === null || b.max === null || b.min < b.max, "Range min must be less than max");

const specSchema = z
  .object({
    id: z.string().uuid().optional(),
    categorySlug: z.string().min(1),
    key: keySchema,
    name: localized("Name", true),
    type: z.enum(["single", "multi", "number", "boolean", "text"]),
    unit: z.string().trim().max(20),
    filterable: z.boolean(),
    buckets: z.array(bucketSchema).max(12),
    options: z
      .array(z.object({ id: z.string().uuid().optional(), key: keySchema, label: localized("Value", true) }))
      .max(200),
  })
  .superRefine((spec, ctx) => {
    const keys = spec.options.map((o) => o.key);
    const duplicate = keys.find((key, i) => keys.indexOf(key) !== i);
    if (duplicate) ctx.addIssue({ code: "custom", path: ["options"], message: `Two values use the key "${duplicate}"` });
  });

export type SpecInput = z.input<typeof specSchema>;

function revalidateCategory(categorySlug: string) {
  revalidatePath(`/admin/categories/${categorySlug}`);
  revalidateEntity("/admin/categories");
}

/** Creates or updates a spec with its values. */
export async function saveSpecAction(input: SpecInput): Promise<ActionState & { id?: string }> {
  const user = await requireAdmin();

  const parsed = specSchema.safeParse(input);
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid spec", errors: parsed.error.flatten().fieldErrors };
  }
  const spec = parsed.data;
  if (spec.type === "text") spec.filterable = false;
  if (spec.type !== "number") spec.buckets = [];
  if (spec.type !== "number") spec.unit = "";

  const categories = await adminGetAllCategories();
  const category = categories.find((c) => c.slug === spec.categorySlug);
  if (!category) return { message: "Category not found" };

  // A key must be unique across the specs a product can have: the main category's and
  // every sub category's specs share one namespace
  const main = category.parent_slug ?? category.slug;
  const family = new Set([main, ...categories.filter((c) => c.parent_slug === main).map((c) => c.slug)]);
  const allSpecs = await adminGetAllSpecs();
  const clash = [...family]
    .flatMap((slug) => allSpecs.get(slug) ?? [])
    .find((s) => s.key === spec.key && s.id !== spec.id);
  if (clash) {
    return {
      message: `The key "${spec.key}" is already used by "${clash.name.en || clash.name.th}" in ${clash.categorySlug}`,
      errors: { key: ["Already used in this category group"] },
    };
  }

  if (spec.id) {
    const current = (allSpecs.get(spec.categorySlug) ?? []).find((s) => s.id === spec.id);
    if (!current) return { message: "Spec not found. It may have been deleted." };
    const usage = await adminGetSpecUsage([spec.id]);
    if ((usage.attributes[spec.id] ?? 0) > 0) {
      if (current.type !== spec.type) {
        return { message: "The type can't change while products have values for this spec." };
      }
      if (current.key !== spec.key) {
        return { message: "The key can't change while products have values for this spec (import files use it)." };
      }
    }
  }

  let id: string;
  try {
    id = await adminSaveSpecAttribute(spec);
  } catch (error) {
    console.error("Failed to save spec:", error);
    return { message: "Failed to save the spec. Please try again." };
  }

  revalidateCategory(spec.categorySlug);
  await logActivity(user, {
    action: spec.id ? "update" : "create",
    entity: "spec",
    entityId: `${spec.categorySlug}/${spec.key}`,
    summary: `${spec.id ? "Updated" : "Created"} spec "${spec.name.en || spec.name.th}" in ${spec.categorySlug}`,
  });
  return { success: true, id };
}

export async function deleteSpecAction(id: string, categorySlug: string): Promise<ActionState> {
  const user = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { message: "Invalid spec" };

  const spec = ((await adminGetAllSpecs()).get(categorySlug) ?? []).find((s) => s.id === id);
  if (!spec) return { message: "Spec not found. It may have been deleted." };

  try {
    await adminDeleteSpecAttribute(id);
  } catch (error) {
    console.error("Failed to delete spec:", error);
    return { message: "Failed to delete the spec. Please try again." };
  }

  revalidateCategory(categorySlug);
  await logActivity(user, {
    action: "delete",
    entity: "spec",
    entityId: `${categorySlug}/${spec.key}`,
    summary: `Deleted spec "${spec.name.en || spec.name.th}" from ${categorySlug} (and its product values)`,
  });
  return { success: true };
}

export async function reorderSpecsAction(categorySlug: string, ids: string[]): Promise<void> {
  const user = await requireAdmin();
  const parsedIds = z.array(z.string().uuid()).max(200).parse(ids);
  await adminReorderSpecAttributes(categorySlug, parsedIds);
  revalidateCategory(categorySlug);
  await logActivity(user, { action: "reorder", entity: "spec", summary: `Reordered ${parsedIds.length} specs in ${categorySlug}` });
}

/** Products using a spec and each of its values (shown before deleting). */
export async function getSpecUsageAction(
  ids: string[]
): Promise<{ attributes: Record<string, number>; options: Record<string, number> }> {
  await requireAdmin();
  return adminGetSpecUsage(z.array(z.string().uuid()).max(200).parse(ids));
}
