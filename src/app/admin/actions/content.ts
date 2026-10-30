"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { adminSaveSiteContent } from "@/lib/db/admin";
import { contentKeysFor } from "@/data/content-fields";
import { SITE_CONTENT_TAG } from "@/lib/site-content";
import { getDefaultContent } from "@/lib/site-content-defaults";

const entrySchema = z.object({
  key: z.string(),
  th: z.string().max(5000),
  en: z.string().max(5000),
});

/**
 * Saves the text fields of one group. A language equal to the file default (or empty)
 * is not stored, so "Reset to default" simply removes the override.
 */
export async function saveContentAction(
  section: string,
  entries: { key: string; th: string; en: string }[]
): Promise<{ success?: boolean; message?: string }> {
  const user = await requireAdmin();

  const parsed = z.array(entrySchema).max(100).safeParse(entries);
  if (!parsed.success) return { message: "Invalid content." };

  const allowed = contentKeysFor(section);
  if (parsed.data.some((e) => !allowed.has(e.key))) {
    return { message: "Unknown field — refresh the page and try again." };
  }

  const upserts: { key: string; value: { th?: string; en?: string } }[] = [];
  const deletes: string[] = [];
  for (const { key, th, en } of parsed.data) {
    const defaults = getDefaultContent(key);
    const value: { th?: string; en?: string } = {};
    if (th.trim() && th !== defaults.th) value.th = th;
    if (en.trim() && en !== defaults.en) value.en = en;
    if (value.th === undefined && value.en === undefined) deletes.push(key);
    else upserts.push({ key, value });
  }

  try {
    await adminSaveSiteContent(upserts, deletes, user.id);
  } catch (error) {
    console.error("Failed to save site content:", error);
    return { message: "Failed to save. Please try again." };
  }

  updateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
  await logActivity(user, {
    action: "update",
    entity: "content",
    entityId: section,
    summary: `Edited ${section} text: ${upserts.map((u) => u.key).join(", ") || "reset to default"}`,
  });
  return { success: true };
}
